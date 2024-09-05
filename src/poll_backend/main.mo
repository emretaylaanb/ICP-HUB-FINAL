import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Hash "mo:base/Hash";



// Aktör
actor PhotoMarket {

// Fotoğraf bilgisi
type Photo = {
    id: Nat;
    title: Text;
    ownedBy: ?Text;
    path: Text;  // Fotoğrafın dosya yolu
    price: Nat;  // Fotoğrafın maliyeti
};

// Kullanıcı bilgisi
type User = {
    username: Text;
    password: Text;
    ownedPhotos: [Photo];
    balance: Nat;  // Kullanıcının bakiyesi
};


  func natHash(n : Nat) : Hash.Hash { 
    Text.hash(Nat.toText(n))
  };

  // Fotoğraflar ve kullanıcılar için HashMap
  var photos = Map.HashMap<Nat, Photo>(10, Nat.equal, natHash);
  var users = Map.HashMap<Text, User>(10, Text.equal, Text.hash);
  var nextPhotoId: Nat = 0;

  // Yeni fotoğraf ekleme
  public func addPhoto(title: Text, path: Text, price: Nat) : async Nat {
    let photo = {
      id = nextPhotoId;
      title = title;
      ownedBy = null;
      path = path;  // Fotoğrafın dosya yolu
      price = price;  // Fotoğrafın maliyeti
    };
    photos.put(nextPhotoId, photo);
    nextPhotoId += 1;
    return nextPhotoId - 1;
  };

  // Kullanıcı kaydı
  public func register(username: Text, password: Text, initialBalance: Nat) : async Bool {
    switch (users.get(username)) {
      case (?_) { return false; }; // Zaten kayıtlı
      case null {
        let newUser = {
          username = username;
          password = password;
          ownedPhotos = [];
          balance = initialBalance;  // Kullanıcının başlangıç bakiyesi
        };
        users.put(username, newUser);
        return true;
      };
    }
  };

  // Kullanıcı girişi
  public func login(username: Text, password: Text) : async ?User {
    switch (users.get(username)) {
      case (?user) {
        if (user.password == password) {
          return ?user;
        } else {
          return null;
        }
      };
      case _ { return null };
    }
  };

  // Satın alınmamış fotoğrafları listeleme
  public query func availablePhotos() : async [Photo] {
    let allPhotos = Iter.toArray(photos.vals());
    let filteredPhotos = Array.filter(allPhotos, func(photo: Photo) : Bool { photo.ownedBy == null });
    return filteredPhotos;
  };

  // Kullanıcının sahip olduğu fotoğrafları gösterme
  public query func userPhotos(username: Text) : async [Photo] {
    switch (users.get(username)) {
      case (?user) { return user.ownedPhotos };
      case _ { return [] };
    }
  };

  // Fotoğraf satın alma
  public func buyPhoto(username: Text, photoId: Nat) : async Bool {
    switch (photos.get(photoId)) {
      case (?photo) {
        if (photo.ownedBy == null) {
          switch (users.get(username)) {
            case (?user) {
              if (user.balance >= photo.price) {  // Kullanıcının bakiyesi yeterli mi?
                let updatedPhoto = {
                  id = photo.id;
                  title = photo.title;
                  ownedBy = ?username;
                  path = photo.path;
                  price = photo.price;
                };
                photos.put(photoId, updatedPhoto);

                // Kullanıcının bakiyesini güncelle
                let updatedUser = {
                  username = user.username;
                  password = user.password;
                  ownedPhotos = Array.append(user.ownedPhotos, [updatedPhoto]);
                  balance = user.balance - photo.price;  // Bakiye güncelle
                };
                
                users.put(username, updatedUser);
                return true;
              } else {
                return false; // Bakiye yetersiz
              }
            };
            case _ { return false };
          }
        } else {
          return false; // Fotoğraf zaten satın alınmış
        }
      };
      case _ { return false }; // Fotoğraf bulunamadı
    }
  };
}
