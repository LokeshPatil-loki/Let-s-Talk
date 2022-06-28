// const RecentChatItemModel = (imgUrl,senderName,message,timeStamp,isRead) => ({
//     imgUrl,senderName,message,timeStamp,isRead,classList: ['recentChatItem']
// });


class RecentChatItemModel{
    constructor(imgUrl,senderName,message,timeStamp,isRead){
        this.imgUrl = imgUrl;
        this.senderName = senderName;
        this.message = message;
        this.timeStamp = timeStamp;
        this.isRead = isRead;
        this.classList = ['recentChatItem'];
    }
}


// Factory
class MessageItemModel{
    constructor(id,message,from,to,timeStamp,type="message",isRead=false,fileName=undefined){
        this.id = id;
        this.message = message;
        this.from = from;
        this.to = to;
        this.timeStamp = timeStamp;
        this.type = type;
        this.isRead = isRead;
        this.fileName = fileName;
    }
} 

class User{
    constructor(uid,name,email,imgUrl,friends){
        this.uid = uid;
        this.name = name;
        this.email = email;
        this.imgUrl = imgUrl;
        this.friends = friends;
    }
}

// class Authentication{
//     signInWithEmailAndPassword(email,password){
//         firebase.auth().signInWithEmailAndPassword(email,password).then(data => {
//             console.log(data.user.email," is logged in");
//         }).catch(err => {
//             console.log("error: ",err.message);
//         });
//     }
// }
