const divRecentChat = document.querySelector('.recentChats');
divRecentChat.clearAll = () => {
    divRecentChat.innerHTML = ""
};
const chatSection = document.querySelector('.chatSection');
const composerSection = document.getElementById("composerSection");
chatSection.clearAll = () => chatSection.innerHTML = "";
const sendButton = document.querySelector('.sendButton');
const textComposer = document.querySelector('.textComposer');
const searchChat = document.querySelector("#searchChat");
const imgFileInput = document.querySelector("#imgFile");
const fileInput = document.getElementById("file");
const sendImageButton = document.querySelector("#sendImage");
const sendFileButton = document.querySelector("#sendFile");
const userNotfound = document.querySelector("#user-not-found");
const notificatioSound = new Audio("resources/text_ring.mp3");
const textComposerContainer = document.querySelector('.textComposerContainer');
const emojiButton = document.getElementById("emoji-button");
const emojiPicker = new EmojiButton({
    autoHide: false,
    position: "top-start"
});
userNotfound.style.visibility = "hidden";
let date = new Date();
let messagesList = [];
let selectedChat = undefined;
let allUsers = [];
let currentUser = JSON.parse(userCookie);
let t;
let receiver;
let isRecentChat = true;
let tempRecentChat = [];



window.onbeforeunload = function(){
    if(selectedChat !== undefined || selectedChat.trim().length <= 0){
        localStorage.setItem("selectedChat"+currentUser.uid,selectedChat);
        
    }
}
window.onload = function(){
    selectedChat = localStorage.getItem("selectedChat"+currentUser.uid);
    if(selectedChat === null){
        selectedChat = undefined;
    }
}

// TODO Show users Profile Picture
document.querySelector("#userProfilePicture").setAttribute("src",currentUser.imgUrl);


// TODO Signout button functionality
document.querySelector("#logout").addEventListener('click',e => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    document.cookie = "loggedInUser=; expires="+date.toUTCString()+";";
    // console.log("before signout: ",firebase.auth().currentUser);
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html"
    }).catch(e => alert(e.message));
    // console.log(e.target);

});

// TODO Redirect to User Settings
document.querySelector("#user-settings").addEventListener('click',e => {
    window.location.href = "user-settings.html";
});


// TODO Search users 
searchChat.addEventListener('keyup',e => {
    const searchedString = e.target.value.toLowerCase();
    if(e.key === "Escape" | searchedString.trim().length === 0){
        // document.getElementById(selectedChat).click();
        if((!divRecentChat.hasChildNodes() || !isRecentChat)){
            clearSearchResult();
            tempRecentChat.forEach(child => divRecentChat.appendChild(child));
            tempRecentChat = [];
            isRecentChat = true;
            userNotfound.style.visibility = "hidden";
            // alert("no element");
        }else{
            // alert((!divRecentChat.hasChildNodes() +" "+ !isRecentChat) + " " + tempRecentChat.length > 0)
        }

        // }
    }else if(searchedString == ":all"){
        allUsers.forEach(recentChatItem => createRecentChatItem(recentChatItem));
        userNotfound.style.visibility = "hidden";
        isRecentChat = false;
    }
    else{
        const filteredResults = allUsers.filter(user => {
            return user.senderName.toLowerCase().match("^"+searchedString+".*$");
        });
        divRecentChat.clearAll();
        if(filteredResults.length === 0)
            userNotfound.style.visibility = "visible";
        else
            userNotfound.style.visibility = "hidden";
        filteredResults.forEach(recentChatItem => createRecentChatItem(recentChatItem));
        isRecentChat = false;
    }
    
});
// Clear search result
function clearSearchResult(){
    searchChat.value = "";
    divRecentChat.clearAll();
    // recentChatList.forEach(recentChatItem => createRecentChatItem(recentChatItem));
}

emojiPicker.on("emoji",emoji => {
    if(textComposer.innerText === "Type your message here"){
        textComposer.innerText = emoji;
    }
    textComposer.innerText += emoji;
});

emojiButton.addEventListener("click",e => {
    emojiPicker.pickerVisible ? emojiPicker.pickerHide : emojiPicker.showPicker(textComposerContainer);
    // document.querySelector(".emoji-picker").style.margin = "0px !important";
    // document.querySelector(".emoji-picker").style.top = "-100px";
    console.log(document.querySelector(".emoji-picker"));
});

// Changing width and height of components according to browser widnow width and height
const resizeComponents = e => {
    //Resize RecentChat Div
    divRecentChat.style.maxHeight = (window.innerHeight - (54+40+80))+ 'px';
    // Resize Message Composer
    textComposerContainer.style.width = (window.innerWidth - document.querySelector('.left').offsetWidth  - 150) + 'px'; 
};
document.body.addEventListener('load',resizeComponents);
window.addEventListener('resize',resizeComponents);



// TODO Send Message
const send = (file="none",type="message") => {
    // Storing message typed on textcomposer into message variable
    let message = file === "none" ? textComposer.innerText.trim() : file;
    // If message is not empty then send that message
    if((message !== 'Type your message here' && message.length !== 0) || file !== "none"){
        let id = currentUser.uid+(Date.now() * Math.random()).toString();
        // let timeStamp = date.toDateString().substring(4) + "\n" + date.toTimeString().substring(0,5);
        let timeStamp = new Date();
        timeStamp = firebase.firestore.Timestamp.fromDate(timeStamp);
        let to = receiver;
        let from = currentUser.uid;
        let item1 = new MessageItemModel(id,message,from,to,timeStamp,type);
        let chatId = from > to ? from + to : to + from;
        sendMessage(item1,chatId);
        // createMessageItem(item1);
        chatSection.scrollTop = chatSection.scrollHeight;
        let temp = document.getElementById(selectedChat.toString());
        if(temp){
            divRecentChat.removeChild(temp);
            divRecentChat.prepend(temp);
        }

    }
    textComposer.innerText = '';
};
sendButton.addEventListener('click',e => {
    send();
});
textComposer.addEventListener('keydown',e => {
    // if(e.keyCode === 13 && e.shiftKey){

    // }
    // else 
    if(e.keyCode === 13 && !e.shiftKey){
        e.preventDefault();
        send();
    }
    
});

// Send Image
sendImageButton.addEventListener("click",e => {
    imgFileInput.click();
});

imgFileInput.addEventListener("change",e => {
    if(imgFileInput.files[0] !== undefined){
        send(imgFileInput.files[0],"image");
    }
});

// Send File
sendFileButton.addEventListener("click",e => {
    fileInput.click();
});

fileInput.addEventListener("change",e => {
    if(fileInput.files[0] !== undefined){
        let fileType = fileInput.files[0].name.split(".");
        fileType = fileType[fileType.length - 1];
        send(fileInput.files[0],fileType);
    }
});

// Message Composer Placeholder Functionality
document.querySelector('.textComposer').addEventListener('focusin',e =>{
    if(e.target.innerText === 'Type your message here'){
        e.target.innerText = '';
    }
    e.target.style.color = 'var(--text-color)';
});
document.querySelector('.textComposer').addEventListener('focusout',e =>{
    if(e.target.innerText === ''){
        e.target.innerText = 'Type your message here';
        e.target.style.color = 'var(--text-color-alpha-60)';
    }
});


// TODO Create Recent Chat Item
const createRecentChatItem = (recentChatItemModel,isPrepend = false) => {
    if(!recentChatItemModel.isRead){
        // console.log(recentChatItemModel.classList);
        recentChatItemModel.classList.push('notRead');
    }
    let item = document.createElement('li');
    let id = recentChatItemModel.id;
    item.setAttribute('id',id);
    recentChatItemModel.classList.forEach(value => {
        item.classList.add(value);
    })
    
    let img = document.createElement('img');
    img.classList.add('recentChatProfileImage');
    img.setAttribute('src',recentChatItemModel.imgUrl);

    let nameMessage = document.createElement('div');
    nameMessage.classList.add('nameMessage');

    let container = document.createElement('div');

    let recentChatSenderName = document.createElement('div');
    recentChatSenderName.classList.add('recentChatSenderName');
    recentChatSenderName.innerText = recentChatItemModel.senderName.length > 19 ? recentChatItemModel.senderName.substring(0,16) + "..." : recentChatItemModel.senderName;

    let recentTimeStamp = document.createElement('div');
    recentTimeStamp.classList.add('recentTimeStamp');
    recentTimeStamp.innerText = recentChatItemModel.timeStamp;

    let recentChatMessage = document.createElement('div');
    recentChatMessage.classList.add('recentChatMessage');
    
    let pMessage = document.createElement('p');
    if(!recentChatItemModel.message){
        pMessage.innerText = "";
        console.log(recentChatItemModel);}
    else pMessage.innerText = recentChatItemModel.message.length > 34 ? recentChatItemModel.message.substring(0,31) + "..." : recentChatItemModel.message;
    
    console.log(item.id);
    if(isPrepend){
        divRecentChat.prepend(item)
    }else{
        divRecentChat.appendChild(item);
    }
    
    item.appendChild(img);
    item.appendChild(nameMessage);
    nameMessage.appendChild(container);
    nameMessage.appendChild(recentChatMessage);
    container.appendChild(recentChatSenderName);
    container.appendChild(recentTimeStamp);
    recentChatMessage.appendChild(pMessage);

    // Select chat
    // Perform some action user clicks on recentChatItem
    // TODO Add click listener to recenet chat item
    item.addEventListener('click',(e) => {
        if(selectedChat !== undefined){
            let chatSelected = document.getElementById(selectedChat);
            // console.log(selectedChat);
            if(chatSelected !== null && chatSelected.classList !== null)
                 chatSelected.classList.remove('selectedChat');
        }
        let chat = document.getElementById(id);
        chat.classList.remove('notRead');
        chat.classList.add('selectedChat');
        selectedChat = chat.getAttribute('id');
        receiver = recentChatItemModel.id;
        chatSection.clearAll();
        if(!recentChatItemModel.isRead){
            console.log("not read");
            markAsRead(currentUser.uid,receiver);
        }
        getMessages(recentChatItemModel.id);
        document.querySelector('.senderProfilePicture').setAttribute('src',recentChatItemModel.imgUrl);
        document.querySelector('.senderName').innerText = recentChatItemModel.senderName;
        if(!isRecentChat){
            clearSearchResult();
            getRecentChats(currentUser.uid);
            isRecentChat = true;
        }
        
    });
    
}




// TODO Create Message Item
const createMessageItem = (messageItemModel) => {
    let item = document.createElement('div');
    item.setAttribute('id',messageItemModel.id);
    item.classList.add('messageItem');
    item.classList.add(messageItemModel.from === currentUser.uid ? 'sent' : 'received');
    item.isRead = messageItemModel.isRead;
    item.senderUID = messageItemModel.to;
    item.receiverUID = messageItemModel.from;

    let messageContainer = document.createElement('div');
    messageContainer.classList.add('messageContainer');

    
    let message;
    switch(messageItemModel.type){
        // Download File
        case 'image':
            message = document.createElement('img');
            message.classList.add('img-message');
            message.src = messageItemModel.message;
            message.onclick = (e) => {
                window.open(message.src);
                // var xhr = new XMLHttpRequest();
                // xhr.responseType = "blob";
                // xhr.onload = (e) => {
                //     var blob = xhr.response;
                // }
                // xhr.open("GET",+message.src);
                // xhr.send(null);
            };
            break;
        case 'message':
        case undefined:
            message = document.createElement('div');
            message.classList.add('message');
            message.innerText = messageItemModel.message;
            break;
        default:
            message = document.createElement("a");
            message.classList.add("file");
            message.url = messageItemModel.message;
            console.log(messageItemModel);
            
            let spanIcon = document.createElement("span");
            spanIcon.classList.add("material-icons","ic-download");
            spanIcon.innerText = "file_download";

            let spanMsg = document.createElement("span");
            spanMsg.classList.add("spanMsg");
            spanMsg.innerText = messageItemModel.fileName;
            message.append(spanIcon);
            message.append(spanMsg);
            message.href = message.url;
            message.target = "_blank";
            message.download = messageItemModel.fileName;


            // message.onclick = (e) => {
            //     window.open(message.url);
            // }

    }

    // Timestamp
    let time = document.createElement('div');
    time.classList.add('time');
    let timestamp = messageItemModel.timeStamp;

    timestamp = timestamp.toDate();
    time.innerText = timestamp.toDateString().substring(4) + "\n" + timestamp.toTimeString().substring(0,5);
    time.status = false;
    item.timeStamp = timestamp;

    item.seenNotSeen = () => {
        time.previous = time.innerText;
        time.innerText = item.isRead ? "Seen" : "Not Seen";
        time.status = true;
    }
   
    // TODO Switch Between read status and timestamp
    // TODO BUG
    messageContainer.addEventListener("click",e => {
        if(messageItemModel.from === currentUser.uid){
            if(item.change !== undefined && item.change === "changed"){
                item.seenNotSeen()
                item.change = undefined
            }else{
                if(!time.status){
                    item.seenNotSeen();
                }else{
                    time.innerText = time.previous;
                    time.status = false;
                }
            }
        }        
    });

    let del = document.createElement("span");
   

    if(item.classList.contains("sent")){
        item.appendChild(messageContainer);
        item.appendChild(del);
        messageContainer.style.alignItems = "flex-end";
    }else{
        item.appendChild(del);
        item.appendChild(messageContainer);
        messageContainer.style.alignItems = "flex-start";

    }
    del.style.visibility = "hidden";
    messageContainer.appendChild(message);
    messageContainer.appendChild(time);


    message.oncontextmenu = e => {
        e.preventDefault();
        if(del.style.visibility === "hidden"){
            del.style.visibility = "visible";
        }else{
            del.style.visibility = "hidden";
        }
        
    };

    del.addEventListener('click',e => {
        if(del.style.visibility === "visible"){
            hideMessage(getChatID(currentUser.uid,selectedChat),item.id,item.classList.contains("sent"));
            chatSection.removeChild(item);
            del.style.visibility = "hidden";
        }
    }); 

    function checkTimeStamp(timestampArg){
        let today =  new Date();
        let yesterday = new Date(); 
        yesterday.setDate(today.getDate() - 1)
        if(timestampArg.toDateString() === today.toDateString()){
            return "Today";
        }else if(timestampArg.toDateString() ===yesterday.toDateString()){
            return "Yesterday";
        }
        return timestampArg.toDateString();
    }

    if(chatSection.lastChild && chatSection.lastChild.timeStamp){
        // console.log(chatSection.lastChild.timeStamp);
        if(timestamp.toDateString() !== chatSection.lastChild.timeStamp.toDateString()){
            let dateSeperatorDiv = document.createElement("div");
            dateSeperatorDiv.classList.add("dateSeperatorDiv");
            let dateSeperator = document.createElement("span");
            dateSeperator.classList.add("dateSeperator");
            dateSeperator.innerText = checkTimeStamp(timestamp);
            dateSeperatorDiv.append(dateSeperator);
            dateSeperatorDiv.id = timestamp.toDateString().replaceAll(" ","-");
            if(document.getElementById(dateSeperatorDiv.id) === null)
                chatSection.append(dateSeperatorDiv);

        }
    }else{
        let dateSeperatorDiv = document.createElement("div");
        dateSeperatorDiv.classList.add("dateSeperatorDiv");
        let dateSeperator = document.createElement("span");
        dateSeperator.classList.add("dateSeperator");
        dateSeperator.innerText = checkTimeStamp(timestamp);
        dateSeperatorDiv.append(dateSeperator);
        dateSeperatorDiv.id = timestamp.toDateString().replaceAll(" ","-");
        if(document.getElementById(dateSeperatorDiv.id) === null)
            chatSection.append(dateSeperatorDiv);
    }
    


    // Add new message items if they don't exisit
    if(document.getElementById(item.id) === null){

        chatSection.appendChild(item);
        chatSection.scrollTo(0,chatSection.scrollHeight);
        del.innerText = "delete";
        del.classList.add("material-icons","delete");
    }

}

// TODO Get all messages for select chat
function getMessages(uid){
    userNotfound.style.visibility = "hidden";
    let chatId = currentUser.uid > uid ? currentUser.uid + uid : uid + currentUser.uid;
    db.collection("messages").doc(chatId).collection(chatId).orderBy("timestamp").onSnapshot((querySnapshot) => {
        querySnapshot.docChanges().forEach(change => {
            if(change.type === "added"){
                const doc = change.doc;
                const msgId = doc.data()["id"];
                const message = doc.data()["message"];
                const from = doc.data()["from"];
                const to = doc.data()["to"];
                const timeStamp = doc.data()["timestamp"];
                const type = doc.data()["type"];
                const isRead = doc.data()["isRead"];
                const deleteForSender = doc.data()["deleteForSender"];
                const deleteForReceiver = doc.data()["deleteForReceiver"];
                const fileName = doc.data()["fileName"];
                let messageItem;

                // Create MessageItem Object according to type of message
                if(type === undefined || type === "message"){
                     messageItem = new MessageItemModel(msgId,message,from,to,timeStamp,"message",isRead);
                }else{
                    messageItem = new MessageItemModel(msgId,message,from,to,timeStamp,type,isRead,fileName);
                }
                
                if(selectedChat === from){
                    createMessageItem(messageItem);
                }
                if(currentUser.uid === from){
                    createMessageItem(messageItem);
                }

                // TODO BUG Read Status
                if(selectedChat === divRecentChat.firstChild.id){
                    console.log("SameUser");
                    if(chatSection.lastChild.classList.contains("received")){
                        markAsRead(currentUser.uid,selectedChat);
                    }
                    if(chatSection.lastChild.classList.contains("sent")){
                        console.log(chatSection.lastChild.isRead);
                        chatSection.lastChild.seenNotSeen();
                    }
                }

                // Delete messages for user
                if(deleteForSender && deleteForReceiver){
                    
                }else if(deleteForSender && currentUser.uid === from){
                    console.log(msgId+" DeleteforSender: " + deleteForSender);
                    let item = document.getElementById(msgId);
                    if(item){
                        chatSection.removeChild(item);
                    }
                }else if(deleteForReceiver && currentUser.uid === to){
                    console.log(msgId + " DeleteforReceiver: " + deleteForReceiver);
                    let item = document.getElementById(msgId);
                    if(item){
                        chatSection.removeChild(item);
                    }
                }

                
            }// When another user read message
            else if(change.type === "modified"){
                console.log(change);
                let messageItem = document.getElementById(change.doc.data()["id"]);
                if(messageItem){
                    messageItem.isRead = change.doc.data()["isRead"];
                    messageItem.change = "changed";
                    messageItem.lastChild.click();
                }
            }


            // if(chatSection.lastChild.isRead === true){
            //     chatSection.childNodes.forEach(child => {
            //         if(child.classList.contains("sent")){
            //             child.isRead = true;
            //             child.lastChild.click();
            //         }
            //     });
            // }
        });
        // const selectedItem = document.getElementById(selectedChat);
        // selectedItem.lastChild.lastChild.firstChild.innerText = chatSection.lastChild.lastChild.firstChild.innerText;
    });
}


let recentChatList = [];

allUsers = getAllUsers(currentUser.uid);

getRecentChats(currentUser.uid);
