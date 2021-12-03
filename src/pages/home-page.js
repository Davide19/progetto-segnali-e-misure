import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';


export class HomePage extends NavElement {
    constructor() {
        super();
    }
    
    render() {
        return html` 
            <br>
            <div class = " columns is-centered is-full ">
                <div class = " column is-11 ">
                    <h1  class = " title is-1 has-text-centered has-text-dark is-italic has-text-weight-bold ">GESTIONE GALLERIA</h1>
                </div> 
            </div>
            <br>
            <div class = " columns  is-centered is-full ">
                <div class = " column is-3 ">
                    <parameters-component></parameters-component>
                </div> 
                <div class = " column is-9 ">
                    <h1  class = " title is-2 has-text-centered has-text-dark is-italic has-text-weight-bold ">GRAFICO</h1>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-10 " style="width:70vw">
                            <chart-component></chart-component>
                        </div>
                    </div>
                </div>
            </div>
            
        `;
    }
         
}


customElements.define('home-page', HomePage);