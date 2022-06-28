const login = (email,password) => {
    document.querySelector('.loader').style.display = 'flex';
    firebase.auth().signInWithEmailAndPassword(email, password).then(data => {
        const currentUser = data.user;
        if(!data.user.emailVerified){
            data.user.sendEmailVerification().then(e => {
                alert("Verification email has been sent to your registed email");
                document.querySelector('.loader').style.display = 'none';
                window.location.href = "login.html";
            }).catch(e => {
                document.querySelector('.loader').style.display = 'none';
                alert(e);
            });
        }else{
            db.collection("users").doc(currentUser.uid).get().then(snapshot => {
                if(snapshot.exists){
                    getUser(currentUser.uid).then(loggedInUser => {
                        var jsonString = JSON.stringify(loggedInUser);
                        document.cookie = "loggedInUser=" + jsonString + ";";
                        document.querySelector('.loader').style.display = 'none';
                        window.location.href = "index.html";
                    });
                }else{
                    db.collection('users').doc(currentUser.uid).set({
                        uid: currentUser.uid,
                        name: currentUser.displayName,
                        email: currentUser.email,
                        imgUrl: currentUser.photoURL
                    }).then(() => {
                        getUser(currentUser.uid).then(loggedInUser => {
                            var jsonString = JSON.stringify(loggedInUser);
                            document.cookie = "loggedInUser=" + jsonString + ";";
                            document.querySelector('.loader').style.display = 'none';
                            window.location.href = "index.html";
                        });
                    }).catch(err => {
                        document.querySelector('.loader').style.display = 'none';
                        alert(err.message);
                    });
                }
            })
        }
    }).catch(err => {
        alert(err.message);
        document.querySelector('.loader').style.display = 'none';
    });
}

const signup = async (fullName,email,password,profilePicture) => {
    document.querySelector('.loader').style.display = 'flex';
    firebase.auth().createUserWithEmailAndPassword(email,password).then(data => {
        const currentUser = data.user;
        
        var fileName = profilePicture.name;
        var task = firebase.storage().ref('profile_pictures/' + fileName).put(profilePicture);
        task.on('state_changed',
            function progress(snapshot) {
                var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (percentage == 100) {
                    task.snapshot.ref.getDownloadURL().then(imgUrl => {
                        const loggedInUser = new User(currentUser.uid,fullName,currentUser.email,imgUrl,[]);
                        console.log(loggedInUser);
                        currentUser.updateProfile({
                            displayName: fullName,
                            photoURL: imgUrl
                        });
                        login(email,password);
                    });
                }
            }
        );

    }).catch(err => alert(err.message));
}

function resetPassword(email){
    firebase.auth().sendPasswordResetEmail(email).then(e => alert("Email sent")).catch(e => alert(e));
}

async function getUser(uid) {
    var documentSnapshot = await db.collection('users').doc(uid).get();
    var name = documentSnapshot.get('name');
    var email = documentSnapshot.get('email');
    var imgUrl = documentSnapshot.get('imgUrl');
    var uid = documentSnapshot.id;
    const loggedInUser = new User(uid, name, email, imgUrl, []);
    return loggedInUser;
}


