import firebase from "firebase/app"


export class FirebaseQuery {

    constructor() {
        this.db = firebase.firestore().collection("objects");

    }

    setName(name) {
        this.doc =this.db.doc(name)
    }

    updateQuantity(name, value){
        this.setName(name)
        this.doc.update("qta", value)
        .catch(err => console.log('error in updateQuantity', err))
    }
    
    uploadItem(name){
        name=name.toLowerCase()
        this.setName(name)
        this.doc.set({
            name: name,
            qta: "0",
            uid: "uid"
        })
    }
    
    //restituisce tutti i documenti del database dentro un array
    readAll(func) {
        this.db.get()
            .catch(e => console.log('error in readAll', e))
            .then(res => {
                var data = [];
                res.docs.forEach(doc => {
                    data.push(doc.data());
                })
                data.sort(
                    function (a, b) {
                        if (a.name < b.name) {
                            return -1;
                        }
                        if (b.name < a.name) {
                            return 1;
                        }
                        return 0;
                    }
                );
                func(data);
            });
    }
    deleteOcject(name){
        this.db.doc(name).delete()
        .catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }
    

    listenToChanges(func){
        /*esegue una callback ad ogni cambiamento del documento
        ma ritorna se stessa per poter rimuovere il listener*/
        return this.db.onSnapshot(data => func(data));
    }
}