import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


export class FirebaseQuery {

    constructor() {
        this.db = firebase.firestore().collection("stats");

    }

    setName(name) {
        this.doc =this.db.doc(name)
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

    //COMPONENT: graph
    //legge solamente la collection graph
    readGraph(func) {
        this.db.doc("graph").get()
            .catch(e => console.log('error in readGraph', e))
            .then(res => {
                var data = res.data();
                func(data);
            });
    }
    /*esegue una callback ad ogni cambiamento del documento
        ma ritorna se stessa per poter rimuovere il listener*/
    listenToChangesGraph(func){
        return this.db.doc("graph").onSnapshot(data => func(data));
    }

    //COMPONENT: parameters
    //legge solamente la collection basic-parameters
    readParameters(func) {
        this.db.doc("basic-parameters").get()
            .catch(e => console.log('error in readGraph', e))
            .then(res => {
                var data = res.data();
                func(data);
            });
    }

    updateParameters(name, value){
        this.db.doc("basic-parameters").update(name, value)
        .catch(err => console.log('error in updateParameters', err))
    }

    /*esegue una callback ad ogni cambiamento del documento
        ma ritorna se stessa per poter rimuovere il listener*/
    listenToChangesParameters(func){
        return this.db.doc("basic-parameters").onSnapshot(data => func(data));
    }

    //COMPONENT: stats

    deleteOcject(name){
        this.db.doc(name).delete()
        .catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }
    

    
}