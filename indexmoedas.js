const convertButton = document.querySelector(".convert-button")

const currencySelect = document.querySelector(".currency-select")

const currencySelect1 = document.querySelector(".currency-select-1")











function convertValues(){

    const inputCurrencyValue = document.querySelector(".input-currency").value

    const currencyValueToConvert = document.querySelector(".currancy-value-to-convert")  // valor em real

    const currencyValueToConverted = document.querySelector(".currancy-value-1") // outras moedas 

    
     
    console.log(currencySelect.value)

    const dolartoday = 5.69

    const euroToday = 6.32

    const bitcoinToday = 595550.81

    const realToday = 1.00

    



        
       if(currencySelect.value == "dolar"){ //se o select estiver selecionado o valor de dolar entra aqui

          currencyValueToConverted.innerHTML = new Intl.NumberFormat("en-US", {

        style: "currency",
        currency: "USD"
    }).format(inputCurrencyValue / dolartoday)


       }

       if(currencySelect.value == "euro"){

        currencyValueToConverted.innerHTML = new Intl.NumberFormat("de-DE", {
              
            style:"currency",
            currency: "EUR"


        } ).format(inputCurrencyValue/euroToday)
       }


        if(currencySelect.value == "bitcoin"){

        currencyValueToConverted.innerHTML = new Intl.NumberFormat("de-DE", {
              
            style:"currency",
            currency: "XBT"


        } ).format(inputCurrencyValue/bitcoinToday)
       }





    currencyValueToConvert.innerHTML = new Intl.NumberFormat("pt-BR",  {
               
              style: "currency",
              currency: "BRL"
            }).format(inputCurrencyValue)
             
            


    
  

    console.log(convertedValue)

}

function changeCurrency() {
     
     let currencyName = document.getElementById("currency-name")
     let currencyfirstName = document.getElementById("currency-firstname")
     let currencyIMG = document.querySelector(".currency-png")

    if (currencySelect.value == "dolar") {
     currencyName.innerHTML = "Dólar americano"
     currencyIMG.src = "./assets2/dolar.png"
     }

     if (currencySelect.value == "euro") {
     currencyName.innerHTML = "Euro"
     currencyIMG.src = "./assets2/euroo.png"
     }

     if (currencySelect.value == "bitcoin") {
     currencyName.innerHTML = "bitcoin"
     currencyIMG.src = "./assets2/bitcoin1.png"
     }


    convertValues()

}


function convertValues(){

const inputCurrencyValue = document.querySelector(".input-currency").value

 const currencyValueToConvert = document.querySelector(".currancy-value-to-convert")  // valor em real

 const currencyValueToConverted = document.querySelector(".currancy-value-1") // outras moedas 

 console.log(currencySelect1.value)

    const dolartoday = 5.69

    const euroToday = 6.32

    const bitcoinToday = 595550.81

    const realToday = 1.00


     if(currencySelect.value == "dolar"){ //se o select estiver selecionado o valor de dolar entra aqui

          currencyValueToConverted.innerHTML = new Intl.NumberFormat("en-US", {

        style: "currency",
        currency: "USD"
    }).format(inputCurrencyValue / dolartoday)


       }

       if(currencySelect.value == "euro"){

        currencyValueToConverted.innerHTML = new Intl.NumberFormat("de-DE", {
              
            style:"currency",
            currency: "EUR"


        } ).format(inputCurrencyValue/euroToday)
       }


        if(currencySelect.value == "bitcoin"){

        currencyValueToConverted.innerHTML = new Intl.NumberFormat("de-DE", {
              
            style:"currency",
            currency: "XBT"


        } ).format(inputCurrencyValue/bitcoinToday)
       }





    currencyValueToConvert.innerHTML = inputCurrencyValue         
            


    
  

    console.log(convertedValue)




}

function changeCurrency() {
     
     let currencyName = document.getElementById("currency-name")
     let currencyfirstName = document.getElementById("currency-firstname")
     let currencyIMG = document.querySelector(".currency-png")

    if (currencySelect.value == "dolar") {
     currencyName.innerHTML = "Dólar americano"
     currencyIMG.src = "./assets2/dolar.png"
     }

     if (currencySelect.value == "euro") {
     currencyName.innerHTML = "Euro"
     currencyIMG.src = "./assets2/euroo.png"
     }

     if (currencySelect.value == "bitcoin") {
     currencyName.innerHTML = "bitcoin"
     currencyIMG.src = "./assets2/bitcoin1.png"
     }


    convertValues()

}







const backgroundMusic = document.getElementById('backgroundMusic');
     backgroundMusic.muted = false; // Remova o mute para que a música possa ser ouvida.

     // Função para pausar a reprodução
     function pausarMusica() {
       backgroundMusic.pause();
     }

     // Função para continuar a reprodução
     function continuarMusica() {
       backgroundMusic.play();
     }

     // Adicione um evento para pausar ao sair da página e continuar ao retornar
     window.addEventListener('beforeunload', pausarMusica);
     window.addEventListener('focus', continuarMusica);
   



currencySelect1.addEventListener("change", changeCurrency)

currencySelect.addEventListener("change", changeCurrency)

convertButton.addEventListener("click", convertValues)
