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
            travelTime:{type: Number}
        }
    }
    
    constructor() {
        super();
        const carLength=4.6;
        this.carsInside=0;
        this.maxCars=0;
        this.occupationRate=0,
        this.expectedTime=0,
        this.travelTime=0
        this.firebaseQuery= new FirebaseQuery();
        this.firebaseQuery.listenToChangesParameters(e => this.firebaseQuery.readParameters(data =>{this.maxCars=Math.floor(data.length/carLength), this.travelTime=Math.ceil(data.length/(data.speedLimit/3.6))}))

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
                            <h1  class = " title is-3 has-text-centered has-text-dark">${this.occupationRate}</h1>
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