import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
export class FirebaseQuery {

    constructor() {
        this.db = firebase.firestore().collection("stats");
    }

    //FIXME: elimina le due funzioni dopo la fase test
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

    //permette di aggiornare selettivamente i parametri del grafico nella fascia d'orario corrente
    updateGraph(travelTime){
        var date=new Date()
        if (date.getHours()>=0 && date.getHours()<=5 ){
            switch(date.getDay()){
                case 0:
                    this.db.doc("graph").update({ "sun1.total_cars": firebase.firestore.FieldValue.increment(1), "sun1.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 1:
                    this.db.doc("graph").update({ "mon1.total_cars": firebase.firestore.FieldValue.increment(1), "mon1.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 2:
                    this.db.doc("graph").update({ "tue1.total_cars": firebase.firestore.FieldValue.increment(1), "tue1.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 3:
                    this.db.doc("graph").update({ "wed1.total_cars": firebase.firestore.FieldValue.increment(1), "wed1.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 4:
                    this.db.doc("graph").update({ "thu1.total_cars": firebase.firestore.FieldValue.increment(1), "thu1.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 5:
                    this.db.doc("graph").update({ "fri1.total_cars": firebase.firestore.FieldValue.increment(1), "fri1.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case  6:
                    this.db.doc("graph").update({ "sat1.total_cars": firebase.firestore.FieldValue.increment(1), "sat1.total_time": firebase.firestore.FieldValue.increment(travelTime)})
            }
        }
        if (date.getHours()>=6 && date.getHours()<=11 ){
            switch(date.getDay()){
                case 0:
                    this.db.doc("graph").update({ "sun2.total_cars": firebase.firestore.FieldValue.increment(1), "sun2.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 1:
                    this.db.doc("graph").update({ "mon2.total_cars": firebase.firestore.FieldValue.increment(1), "mon2.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 2:
                    this.db.doc("graph").update({ "tue2.total_cars": firebase.firestore.FieldValue.increment(1), "tue2.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 3:
                    this.db.doc("graph").update({ "wed2.total_cars": firebase.firestore.FieldValue.increment(1), "wed2.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 4:
                    this.db.doc("graph").update({ "thu2.total_cars": firebase.firestore.FieldValue.increment(1), "thu2.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 5:
                    this.db.doc("graph").update({ "fri2.total_cars": firebase.firestore.FieldValue.increment(1), "fri2.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case  6:
                    this.db.doc("graph").update({ "sat2.total_cars": firebase.firestore.FieldValue.increment(1), "sat2.total_time": firebase.firestore.FieldValue.increment(travelTime)})
            }            
        }
        if (date.getHours()>=12 && date.getHours()<=17 ){
            switch(date.getDay()){
                case 0:
                    this.db.doc("graph").update({ "sun3.total_cars": firebase.firestore.FieldValue.increment(1), "sun3.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 1:
                    this.db.doc("graph").update({ "mon3.total_cars": firebase.firestore.FieldValue.increment(1), "mon3.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 2:
                    this.db.doc("graph").update({ "tue3.total_cars": firebase.firestore.FieldValue.increment(1), "tue3.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 3:
                    this.db.doc("graph").update({ "wed3.total_cars": firebase.firestore.FieldValue.increment(1), "wed3.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 4:
                    this.db.doc("graph").update({ "thu3.total_cars": firebase.firestore.FieldValue.increment(1), "thu3.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 5:
                    this.db.doc("graph").update({ "fri3.total_cars": firebase.firestore.FieldValue.increment(1), "fri3.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case  6:
                    this.db.doc("graph").update({ "sat3.total_cars": firebase.firestore.FieldValue.increment(1), "sat3.total_time": firebase.firestore.FieldValue.increment(travelTime)})
            }            
        }
        if (date.getHours()>=18 && date.getHours()<=23 ){
            switch(date.getDay()){
                case 0:                    
                    this.db.doc("graph").update({ "sun4.total_cars": firebase.firestore.FieldValue.increment(1), "sun4.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 1:
                    this.db.doc("graph").update({ "mon4.total_cars": firebase.firestore.FieldValue.increment(1), "mon4.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 2:
                    this.db.doc("graph").update({ "tue4.total_cars": firebase.firestore.FieldValue.increment(1), "tue4.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 3:
                    this.db.doc("graph").update({ "wed4.total_cars": firebase.firestore.FieldValue.increment(1), "wed4.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 4:
                    this.db.doc("graph").update({ "thu4.total_cars": firebase.firestore.FieldValue.increment(1), "thu4.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case 5:
                    this.db.doc("graph").update({ "fri4.total_cars": firebase.firestore.FieldValue.increment(1), "fri4.total_time": firebase.firestore.FieldValue.increment(travelTime)})
                    break;
                case  6:
                    this.db.doc("graph").update({ "sat4.total_cars": firebase.firestore.FieldValue.increment(1), "sat4.total_time": firebase.firestore.FieldValue.increment(travelTime)})
            }            
        }
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
    
    //aggiorna il campo (name) della collectiion basic-parameters con value
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
    //legge solamente la collection cars e la ordina in base al tempo di arrivo
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

    //inserisce nel database il documento relativo ad un'auto e il suo tempo d'arrivo
    uploadCar(name){
        name=name.toString()
        this.doc =this.db.doc("cars").collection("inside").doc(name);
        this.doc.set({
            arrival: Math.floor(new Date().getTime()/1000),
        })
    }

    //elimina un'auto dalla collection
    deleteCar(name){
        this.db.doc("cars").collection("inside").doc(name.toString()).delete()
        .catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }

     /*esegue una callback ad ogni cambiamento del documento
        ma ritorna se stessa per poter rimuovere il listener*/
    listenToChangesCars(func){
        return this.db.doc("cars").collection("inside").onSnapshot(data => func(data));
    }    
}