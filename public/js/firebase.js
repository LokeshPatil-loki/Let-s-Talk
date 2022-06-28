// Add your configuration
var firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

class Authentication{
    signInWithEmailAndPassword(email,password){
        firebase.auth().signInWithEmailAndPassword(email,password).then(data => {
            console.log(data.user.email," is logged in");
        }).catch(err => {
            console.log("error: ",err.message);
        });
    }
}

const getAllUsers = (uid) => {
    const allUsers = [];
    db.collection("users").get().then(data => {
        data.docs.forEach(doc => {
            const data = doc.data();
            if(data.uid !== uid){
                let item = new RecentChatItemModel(data.imgUrl,data.name,data.email,"",true);
                // let item = new User(data.uid,data.name,data.email,data.imgUrl,null);
                // item.isRead = false;
                item.id = data.uid.toString();
                allUsers.push(item);
            }
        });
        // console.log(allUsers);
    });
    return allUsers;
};



const sendMessage = (messageItem,chatId) => {
    console.log(messageItem.timeStamp);
    const data = {
        id: messageItem.id,
        message: messageItem.message,
        from: messageItem.from,
        to: messageItem.to,
        timestamp:messageItem.timeStamp,
        type: messageItem.type,
        isRead: messageItem.isRead
    };
    if(data.type === "image"){
        var fileName = chatId+data.timestamp+data.message.name;
        // var task = firebase.storage().ref('images/' + fileName).put(data.message);
        firebase.storage().ref('images/' + fileName).put(data.message).then(snapshot => {
            snapshot.ref.getDownloadURL().then(url => {
                console.log(url);
                data.fileName = data.message.name;
                data.message = url;

                db.collection('messages/'+chatId+"/"+chatId).doc(data.id).set(data).then(e => console.log("Message sent"));
            })
        });
        // task.on('state_changed',
        //     function progress(snapshot) {
        //         var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        //         if (percentage == 100) {
        //             task.snapshot.ref.getDownloadURL().then(imgUrl => {
        //                 console.log(imgUrl);
        //                 data.message = imgUrl;
        //                 db.collection('messages/'+chatId+"/"+chatId).doc(data.id).set(data).then(e => console.log("Message sent"));
        //             });
        //         }
        //     }
        // );
    }else if(data.type !== "message" && data.type){
        var fileName = chatId+data.timestamp+data.message.name;
        // var task = firebase.storage().ref('images/' + fileName).put(data.message);
        firebase.storage().ref('files/' + fileName).put(data.message).then(snapshot => {
            snapshot.ref.getDownloadURL().then(url => {
                console.log(url);
                data.fileName = data.message.name;
                data.message = url;
                // alert(data.message.name);
                db.collection('messages/'+chatId+"/"+chatId).doc(data.id).set(data).then(e => console.log("Message sent"));
            })
        });
    }else{
        db.collection('messages/'+chatId+"/"+chatId).doc(data.id).set(data).then(e => console.log("Message sent"));
    }
    db.collection("users").doc(data.from).collection("recentChat").doc(data.to).set({timestamp:data.timestamp}).then(console.log("done"));
    db.collection("users").doc(data.to).collection("recentChat").doc(data.from).set({timestamp:data.timestamp}).then(console.log("done"));

}

const getRecentChats = (uid) => {
    db.collection("users").doc(uid).collection("recentChat").orderBy("timestamp").onSnapshot(querySnapshot => {
        querySnapshot.docChanges().forEach(change => {
            const doc = change.doc;
            let timestamp = doc.data().timestamp.toDate();
            let isGroup = doc.data().isGroup;
            let id = isGroup ? doc.data.id : doc.id;
            // timestamp = timestamp.toDateString().substring(4) + " " + timestamp.toTimeString().substring(0,5);
            timestamp = checkDate(timestamp);
            db.collection(isGroup ? "group" : "users").doc(id).get().then(documentSnapshot => {
                let data = documentSnapshot.data();
                let chatId = isGroup ? id : getChatID(uid,data.uid);
                db.collection( isGroup ? "group" : "messages").doc(chatId).collection(chatId).orderBy("timestamp","desc").get().then(snapshot => {
                    let message = snapshot.docs[0].data().message;
                    let type = snapshot.docs[0].data().type;
                    let isRead = snapshot.docs[0].data().isRead;
                    let from = snapshot.docs[0].data().from;
                    let to = snapshot.docs[0].data().to;
                    isRead = isRead === undefined ? true : isRead;
                    // console.log(message);
                    // console.log(type)
                    let item = new RecentChatItemModel(data.imgUrl,data.name,type == "message" ? message : snapshot.docs[0].data().fileName,timestamp,uid === from ? true : isRead);
                    item.id = data.uid.toString();
                    switch(change.type){
                        case "added":
                            if(document.getElementById(item.id) !== null)
                                divRecentChat.removeChild(document.getElementById(item.id));
                            searchChat.value = ""
                            createRecentChatItem(item,true);
                            // if()
                            tempRecentChat.push(divRecentChat.firstChild);
                                                     
                            if(divRecentChat.firstChild.id === selectedChat){
                                divRecentChat.firstChild.click();
                            }else{
                                getMessages(selectedChat);   
                            }
                            break;
                        case "modified":
                            if(document.getElementById(item.id) !== null)
                                divRecentChat.removeChild(document.getElementById(item.id));
                            searchChat.value = ""
                            createRecentChatItem(item,true);
                            if(to === currentUser.uid && from !== selectedChat){
                                notificatioSound.play();
                            }
                            // if()
                            tempRecentChat.push(divRecentChat.firstChild);
                                                     
                            if(divRecentChat.children.length === 1 && divRecentChat.firstChild.id === selectedChat){
                                divRecentChat.firstChild.click();
                            }else{
                                getMessages(selectedChat);   
                            }
                            break;
                    }
                });

            });
        });
    });
}

function checkDate(date){
    let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
    let today = new Date();
    if(date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()){
        if(date.getDate() === today.getDate())
            return date.toTimeString().substring(0,5);
        else if(date.getDate() === today.getDate() - 1){
            return "Yesterday";
        }else if(today.getDate() - date.getDate() <= 7){
            return days[date.getDay()];
        }else{
            return date.toDateString().substring(4);
        }
    }else{
        return date.toDateString().substring(4);
    }
}

function getChatID(uid1,uid2){
    return uid1 > uid2 ? (uid1 + uid2) : (uid2 + uid1);
}

function markAsRead(uid1,uid2){
    let chatId = getChatID(uid1,uid2);
    console.log(chatId);
    db.collection("messages").doc(chatId).collection(chatId).orderBy("timestamp","desc").get().then(data => {
        let messageId = data.docs[0].data().id;
        console.log(messageId);
        db.collection("messages").doc(chatId).collection(chatId).doc(messageId).update({isRead: true});
    });
}

function updateData(uid,obj){
    function update(){
        db.collection("users")
            .doc(uid)
            .update(obj)
            .then(e => {
                alert("Data updated successfully");
                if(obj.name){
                    document.cookie = document.cookie.replace(currentUser.name,obj.name);
                    firebase.auth().currentUser.updateProfile({
                        displayName: obj.name
                    });
                }
                if(obj.imgUrl){
                    document.cookie = document.cookie.replace(currentUser.imgUrl,obj.imgUrl);
                    firebase.auth().currentUser.updateProfile({
                        photoURL: obj.imgUrl
                    });
                }
                    
                document.querySelector('.loader').style.display = 'none';
            })
            .catch(e => alert(e));
    }
    
    function updateWithImage(){
        document.querySelector('.loader').style.display = 'flex';
        var fileName = obj.imgUrl.name.split(".");
        fileName = fileName[fileName.length -1];
        fileName = currentUser.uid + Date.now().toString() + "." + fileName;
        console.log(fileName);
        var task = firebase.storage().ref('profile_pictures/' + fileName).put(obj.imgUrl).then(data => {
            data.ref.getDownloadURL().then(url => {
                console.log(url);
                obj.imgUrl = url;
                update();
            })
        });
        // task.on('state_changed',
        //     function progress(snapshot) {
        //         var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        //         console.log(percentage);
        //         if (percentage == 100) {
                    
        //             firebase.storage().ref('profile_pictures/'+fileName).getDownloadURL().then(imgUrl => {
        //                 console.log(imgUrl);
        //                 obj.imgUrl = imgUrl;
        //                 update();
        //             });
        //             // task.snapshot.ref.getDownloadURL().then(imgUrl => {
        //             //     console.log(imgUrl);
        //             //     obj.imgUrl = imgUrl;
        //             //     update();
        //             // });
        //         }
        //     }
        // );
    }
    if(obj.name && obj.imgUrl){
        updateWithImage();
        
    }
    else if(obj.imgUrl){
        updateWithImage()
    }else if(obj.name){
        update();
    }
}

function hideMessage(chatId,messageId,isSender){
    let data = {};
    if(isSender){
        data.deleteForSender = true;
    }else{
        data.deleteForReceiver = true;
    }
    db.collection("messages").doc(chatId).collection(chatId).doc(messageId).update(data)
        .then(e => console.log(messageId + " deleted"))
        .catch(e => console.log(e));
    
}

function deleteMessage(chatId,messageId){
    db.collection("message").doc(chatId).collection(chatId).doc(messageId).delete()
        .then(e => console.log(messageId + " deleted from firestore"))
        .catch(e => console.log(e));
}

function createGroup(name,admin,members){
    let groupId = name.replaceAll(" ","_");
    groupId = groupId + admin;
    let data = {
        name: name,
        admin: admin,
        members, members
    };
    db.collection("group").doc(groupId).set(data).then(snapshot => {
        const timestamp = firebase.firestore.Timestamp.fromDate(new Date());
        members.forEach( (member) => {
            db.collection("users").doc(member).collection("recentChat").doc(groupId).set({
                timestamp: timestamp,
                isGroup: true,
                id: groupId 
            });
        });
        let msgId = "group1"+admin+Date.now();
        db.collection("group").doc(groupId).collection(groupId).doc(msgId).set({
            id: msgId,
            message: name+" is created",
            from: admin,
            to: groupId,
            timestamp:timestamp,
            type: "message",
        });
    });
}