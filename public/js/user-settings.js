let currentUser = JSON.parse(userCookie);
let inputName = document.querySelector("#name");
let inputEmail = document.querySelector("#email");
let btnSaveChanges = document.querySelector("#btn-save-changes");
let btnBack = document.querySelector("#back-button");
let img = document.querySelector("#userProfilePicture");
let profilePicture = document.querySelector("#profilePicture");
let form = document.querySelector("#form");

img.src = currentUser.imgUrl;
inputName.value = currentUser.name;
inputEmail.value = currentUser.email;


profilePicture.addEventListener('change', () => {
    img.src = URL.createObjectURL(profilePicture.files[0]);
});

btnSaveChanges.addEventListener("click",e => {
    if(inputName.value !== currentUser.name && img.src !== currentUser.imgUrl){
        if(confirm("Are you sure you want to update your name and profile picture?")){
            updateData(currentUser.uid,{name: inputName.value,imgUrl: profilePicture.files[0]});
        }
    }else if(inputName.value !== currentUser.name){
        // confirm("Are you sure you want to update your name?");
        if(confirm("Are you sure you want to update your name?")){
            updateData(currentUser.uid,{name: inputName.value});
        }
    }else if(img.src !== currentUser.imgUrl){
        if(confirm("Are you sure you want to update your profile picture?")){
            updateData(currentUser.uid,{imgUrl: profilePicture.files[0]});
        }
    }
    

});

form.addEventListener("submit", e => {
    e.preventDefault();
});

btnBack.addEventListener("click",e => {
    window.location.href = "index.html";
});




