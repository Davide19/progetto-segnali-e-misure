import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';
import { FirebaseQuery } from '../core/firebase-query';

export class Parameters extends NavElement {
    
    static get properties() {
        return {
            length: { type: Number },
            speedLimit: { type: Number }
        }
    }
    
    constructor() {
        super();
        this.length=0;
        this.speedLimit=0;
        this.firebaseQuery= new FirebaseQuery();
        this.firebaseQuery.listenToChangesParameters(e => this.firebaseQuery.readParameters(data =>{this.length=data.length, this.speedLimit=data.speedLimit}))
    }
    //FIXME: sistema caricamento 
    //permette di aggiornare i parametri della galleria
    updateParameters(){
        if(document.getElementById("length").value==""|| isNaN(parseInt(document.getElementById("length").value))){
            document.getElementById("length").classList.toggle("is-danger")
            if(document.getElementById("speedLimit").value==""|| isNaN(parseInt(document.getElementById("speedLimit").value))){
                document.getElementById("speedLimit").classList.toggle("is-danger")
            }
        }
        else{
            if(document.getElementById("speedLimit").value==""|| isNaN(parseInt(document.getElementById("speedLimit").value))){
                document.getElementById("speedLimit").classList.toggle("is-danger")
            }
            else{
                this.firebaseQuery.updateParameters("length", parseInt(document.getElementById("length").value));
                this.firebaseQuery.updateParameters("speedLimit", parseInt(document.getElementById("speedLimit").value));
                document.getElementById("length").classList.remove("is-danger")
                document.getElementById("speedLimit").classList.remove("is-danger")
                document.getElementById("length").value="";
                document.getElementById("speedLimit").value="";
            }            
        }
    }
    
    render() {
        return html`  
            
                    <h1  class = " title is-3 has-text-centered has-text-dark is-italic has-text-weight-bold ">PARAMETRI</h1>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-8 ">
                            <h1  class = " title is-3 has-text-left has-text-dark   ">Lunghezza [m]</h1>
                        </div>
                        <div class = " column is-3 ">
                            <input class="input has-text-centered is-dark" id="length" type="text" placeholder=${this.length}>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-8 ">
                            <h1  class = " title is-3 has-text-left has-text-dark ">Limite di Velocità [km/h]</h1>
                        </div>
                        <div class = " column is-3 ">
                            <input class="input has-text-centered is-dark" id="speedLimit" type="text" placeholder=${this.speedLimit}>                  
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-3 ">
                            <button class="button is-dark is-normal" @click=${e => this.firebaseQuery.updateLast()}>Entra</button>
                        </div>
                        <div class = " column is-3 ">
                            <button class="button is-dark is-normal" @click=${e => this.firebaseQuery.updateFirst()}>Esce</button>
                        </div>
                        <div class = " column is-4 ">
                            <button class="button is-dark is-normal" @click=${e => this.updateParameters()}>CONFERMA</button>
                        </div>
                    </div>
        `;
    }         
}
customElements.define('parameters-component', Parameters);