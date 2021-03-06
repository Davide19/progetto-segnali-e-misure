import { html } from 'lit-element';
import { render } from 'lit-html';
import { NavElement } from '../core/nav-element';
export class Clock extends NavElement {
    
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        //intervallo di aggiornamento dell'orologio
        setInterval(() => {
          this.date = new Date();
        }, 1000);      
      }
    //forza il render della pagina invalidando la data precedente
    async invalidate() {
      if (!this.needsRender) {
        this.needsRender = true;      
        this.needsRender = await false;
        render(this.render(), this.shadowRoot);
      }
    }
       
    get date() { return this._date; }
    set date(v) { this._date = v; this.invalidate(); }
    
    //restituisce la stringa col giorno della settimana
    day(n){
        const weekday = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
        return weekday[n];
    }

    //aggiunge uno zero ad un valore se minore di 10
    time(n){
        if(n<10)
            return "0"+n;
        else
            return n;
    }

    //calcola la datanel formato giorno gg/mm/aaaa h:min:s
    finalDate(){
        var final=this.day(this.date.getDay())+" "+this.date.getDate()+"/"+(this.date.getMonth()+1)+"/"+this.date.getFullYear()+" "+this.time(this.date.getHours())+":"+this.time(this.date.getMinutes())+":"+this.time(this.date.getSeconds());
        return final;
    }
  
    render() {
      return html`
        <h1 style="font-size: 2.5vh; font-weight: 600; color: #363636 !important; text-align:center;">${this.finalDate()}</h1>       
      `;
    }
}
customElements.define('clock-component', Clock);