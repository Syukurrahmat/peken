function addCart(e, dfl = 0){
    console.log(e)
    let cart_p = e.parentElement
    cart_p.children[0].style.display = 'none'
    cart_p.children[1].style.display = 'flex'

    let cart = document.querySelector('.sumCart')

    let id = e.closest('section').getAttribute('data-id')
    let stock = e.closest('section').getAttribute('data-stock')
    let price = rupah2num(e.closest('section').querySelector('.price').innerHTML)
    console.log(price)
    
    let min = cart_p.querySelector('.cart-n div:first-child')
    let number = cart_p.querySelector('.cart-n input')
    let plus = cart_p.querySelector('.cart-n div:last-child')
    
    number.value=dfl
    plusCart()
    
    min.addEventListener('click',minCart)
    plus.addEventListener('click',plusCart)

    console.log()

    function minCart(){
        number.value--
        if(number.value<1) removeCart()
        up()      
    }
    async function plusCart(){
        if(number.value!=stock){
            number.value++
            up()
        }
    }
    function removeCart(){
        cart_p.children[0].style.display = 'block'
        cart_p.children[1].style.display = 'none'
        min.removeEventListener('click',minCart)
        plus.removeEventListener('click',plusCart)
    }

    number.addEventListener('change',()=>{
        if(parseInt(number.value) < 0 ) number.value = 0
        if(parseInt(number.value) > parseInt(stock)){
            number.value = stock
        }
        up()
        
    })


    function up(){
        console.log('ter up')
        fetch('http://localhost:5000/cart',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body : JSON.stringify({'id':id , 'total' : number.value})
        }).then(res=>res.json())
        .then(res=>{
            cart.innerHTML = num2rupiah(res)
        })
    }
}


function openSelect(e) {
    let elm = e.target.closest('.select')
    let input = elm.querySelector('input')

    elm.querySelector('.option').classList.toggle('show')

    
    elm.querySelectorAll('.option div').forEach(div=> div.addEventListener('click',pilih))
    elm.addEventListener('blur',blur)
    
    function blur(){
        elm.querySelector('.option').classList.remove('show')
        elm.removeEventListener('blur',blur)
    }
    function pilih(e){
        
        input.value = e.target.innerHTML


        elm.querySelector('.option').classList.remove('show')
        elm.querySelectorAll('.option div').forEach(div=> div.removeEventListener('click',pilih))
    }
}

function loading(){
    let selector = 'section > div:nth-child(1), section a , section p ,section button'
    let item = document.querySelectorAll(selector) 
    item.forEach(el=>el.classList.add('loading'))
}
function unloading(e){
    e.querySelectorAll('*').forEach(el=>el.classList.remove('loading'))
}


function num2rupiah(number){
    return  new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"})
     .format(number)
     .replace('IRD','Rp.')
     .replace(',00','')
 }
function rupah2num(number){
    return Number(number.replace('Rp&nbsp;','').replace('.',''))
 }