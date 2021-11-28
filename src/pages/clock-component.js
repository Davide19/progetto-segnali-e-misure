import { html } from 'lit-element';
import { render } from 'lit-html';
import { NavElement } from '../core/nav-element';


export class Clock extends NavElement {
    
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        setInterval(() => {
          this.date = new Date();
        }, 1000);      
      }
    
    get date() { return this._date; }
    set date(v) { this._date = v; this.invalidate(); }

    day(n){
        const weekday = new Array(7);
        weekday[0] = "Domenica";
        weekday[1] = "Lunedì";
        weekday[2] = "martedì";
        weekday[3] = "Mercoledì";
        weekday[4] = "Giovedì";
        weekday[5] = "venerdì";
        weekday[6] = "sabato";
        return weekday[n];
    }
    time(n){
        if(n<10)
            return "0"+n;
        else
            return n;
    }
    finalDate(){
        var final=this.day(this.date.getDay())+" "+this.date.getDate()+"/"+this.date.getMonth()+"/"+this.date.getFullYear()+" "+this.time(this.date.getHours())+":"+this.time(this.date.getMinutes())+":"+this.time(this.date.getSeconds());
        return final;
    }
  
    render() {
      return html`
        <h1 style="font-size: 2.5vh; font-weight: 600; color: #363636 !important; text-align:center;">${this.finalDate()}</h1>       
      `;
    }

    async invalidate() {
      if (!this.needsRender) {
        this.needsRender = true;      
        this.needsRender = await false;
        render(this.render(), this.shadowRoot);
      }
    }
}


customElements.define('clock-component', Clock);