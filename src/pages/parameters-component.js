import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';
import { FirebaseQuery } from '../core/firebase-query';

export class Parameters extends NavElement {
    constructor() {
        super();
        

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
                            <h1  class = " title is-3 has-text-centered has-text-dark">2</h1>
                        </div>
                    </div>
                    <hr>                    
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark">Tasso di Occupazione</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark  ">Tempo Stimato di Percorrenza</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark  ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <h1  class = " title is-3 has-text-centered has-text-dark is-italic has-text-weight-bold ">PARAMETRI</h1>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark   ">Lunghezza</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark  ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-3 has-text-left has-text-dark   ">Limite di Velocità</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-3 has-text-centered has-text-dark   ">2</h1>
                        </div>
                    </div>
                    <hr> 
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-5 ">
                            <button class="button is-dark is-normal" @click=${e => this.firebaseQuery.readGraph(data =>{console.log(data)})}>CONFERMA</button>
                        </div>
                    </div>
        `;
    }
         
}


customElements.define('parameters-component', Parameters);