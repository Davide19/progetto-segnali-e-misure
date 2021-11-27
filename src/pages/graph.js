import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';


export class Prova extends NavElement {
    constructor() {
        super();
    }
    render() {
        return html`  
                    <div class = " columns is-centered is-full ">
                <div class = " column is-11 ">
                    <h1  class = " title is-size-2 has-text-centered has-text-dark is-italic has-text-weight-bold ">GESTIONE GALLERIA</h1>
                </div> 
            </div>
        `;
    }
         
}


customElements.define('prova-page', Prova);