import { html } from 'lit-element';
import { NavElement } from '../core/nav-element';

export class HomePage extends NavElement {
    constructor() {
        super();
    }

    render() {
        return html` 
            <br>
            <div class = " columns is-mobile is-centered is-full ">
                <div class = " column is-11 ">
                    <h1  class = " title is-size-1 has-text-centered has-text-dark is-italic has-text-weight-bold ">MY SPESA</h1>
                </div> 
            </div>
            <br>
            
        `;
    }
}

customElements.define('home-page', HomePage);