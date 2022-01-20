import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';
import { FirebaseQuery } from '../core/firebase-query';
export class Stats extends NavElement {
     
    static get properties() {
        return {
            carsInside: { type: Number },
            maxCars: { type: Number },
            occupationRate:{ type: Number },
            expectedTime:{ type: Number },
            travelTime:{type: Number},
        }
    }
    
    constructor() {
        super();
        this.carsInside=0;
        this.maxCars=0;
        this.occupationRate=0,
        this.expectedTime=0,
        this.times=[0,0,0,0,0,0,0,0,0,0],
        this.index=0,
        this.travelTime=0
        this.last=0
        this.first=0
        this.firebaseQuery= new FirebaseQuery();
        this.firebaseQuery.listenToChangesParameters(e => this.firebaseQuery.readParameters(data =>{this.updateProperties(data)}))
    }

    //aggiorna le priprietà dell'interfaccia grafica
    //gestisce l'arrivo e la partenza delle auto
    updateProperties(data){
        this.maxCars=Math.floor(data.length/4.6);//4.6m lunghezza media di un auto
        this.travelTime=Math.ceil(data.length/(data.speedLimit/3.6));
        this.carsInside=data.last-data.first;
        this.occupationRate=Math.round(this.carsInside/this.maxCars*100)
            if(this.first!=data.first && this.first!=0){
                var deleted=this.first
                this.first=data.first;
                if(this.index==10){
                    this.index=0;
                }
                this.firebaseQuery.readCars(data =>{this.calculateExpectedTime(data,deleted)})            
            }
            else{
                this.first=data.first;
            }
            if(this.last!=data.last && this.last!=0){
                this.firebaseQuery.uploadCar(this.last)
                this.last=data.last;
            }
            else{
                this.last=data.last;
            }        
    }

    //rimuove l'ultima auto (inserito qua per evitare problemi con l'asincronicità delle operazioni sul database)
    //aggiorna i valori relativi al grafico
    //calcola il tempo medio di percorrenza (tenendo conto degli ultimi 10 veicoli) e aggiorna questo valore nel database
    calculateExpectedTime(data,deleted){
        this.firebaseQuery.deleteCar(deleted);
        if(this.index==10){
            this.index=0;
        }
        this.times[this.index]=Math.floor((new Date().getTime()-data[0].arrival)/1000)
        this.firebaseQuery.updateGraph(this.times[this.index])
        this.index=this.index+1;     
        var expectedTime=0
        var n=0
        for (let i = 0; i < 10; i++) {
            if(this.times[i]!=0){
                expectedTime += this.times[i];
                n++;
            }
        }
        this.expectedTime=Math.round(expectedTime/n);
        this.firebaseQuery.updateParameters("average_time", this.expectedTime);
    }
    
    render() {
        return html`  
            <h1  class = " title is-2 has-text-centered has-text-dark is-italic has-text-weight-bold ">STATISTICHE</h1>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-11 ">
                            <clock-component></clock-component>
                        </div>
                    </div>
                    <hr> 
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark">Auto Attualmente all'Interno</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark">${this.carsInside}</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark">Massimo Numero di Auto Possibile</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark">${this.maxCars}</h1>
                        </div>
                    </div>
                    <hr>                    
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark">Tasso di Occupazione</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark">${this.occupationRate}%</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark  ">Tempo Stimato di Percorrenza [s]</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark  ">${this.expectedTime}</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark  ">Tempo Minimo di Percorrenza [s]</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark  ">${this.travelTime}</h1>
                        </div>
                    </div>
                    <hr>
                    <parameters-component></parameters-component>
        `;
    }         
}
customElements.define('stats-component', Stats);