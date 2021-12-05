import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


export class FirebaseQuery {

    constructor() {
        this.db = firebase.firestore().collection("stats");

    }
    setName(name) {
        this.doc =this.db.doc(name.toString())
    }/*
    uploadCar(name){
        name=name.toString()
        this.doc =this.db.doc(name)
        this.doc.set({
            qta: "0",
            uid: "uid"
        })
    }*/
    updateFirst(){
        this.db.doc("basic-parameters").update({ first: firebase.firestore.FieldValue.increment(1) })
        .catch(err => console.log('error in updateFirst', err))
    }
    updateLast(){
        this.db.doc("basic-parameters").update({ last: firebase.firestore.FieldValue.increment(1) })
        .catch(err => console.log('error in updateLast', err))
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

    //COMPONENT: basic-parameters
    //legge solamente la collection basic-parameters
    readParameters(func) {
        this.db.doc("basic-parameters").get()
            .catch(e => console.log('error in readParameters', e))
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

    //COMPONENT: cars
    readCars(func) {
        this.db.doc("cars").collection("inside").get()
            .catch(e => console.log('error in readAll', e))
            .then(res => {
                var data = [];
                res.docs.forEach(doc => {
                    data.push(doc.data());
                })
                data.sort(
                    function (a, b) {
                        if (a.arrival < b.arrival) {
                            return -1;
                        }
                        if (b.arrival < a.arrival) {
                            return 1;
                        }
                        return 0;
                    }
                );
                func(data);
            });
    } 
    
    uploadCar(name){
        name=name.toString()
        this.doc =this.db.doc("cars").collection("inside").doc(name);
        this.doc.set({
            arrival: Math.floor(new Date().getTime()/1000),
        })
    }
    listenToChangesCars(func){
        return this.db.doc("cars").collection("inside").onSnapshot(data => func(data));
    }
    deleteCar(name){
        this.db.doc("cars").collection("inside").doc(name.toString()).delete()
        .catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }
    

    
}