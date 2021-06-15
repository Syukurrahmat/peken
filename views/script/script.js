function addCart(e, dfl = 0 ,begin = false,cartlist=false){
    let cart = document.querySelector('.sumCart')
    let id = e.closest('section').getAttribute('data-id')
    let stock = e.closest('section').getAttribute('data-stock')
    
    if(stock==0) return notif('barang tidak tersedia')
    
    let cart_p = e.parentElement
    cart_p.children[0].style.display = 'none'
    cart_p.children[1].style.display = 'flex'

    let min = cart_p.querySelector('.cart-n div:first-child')
    let number = cart_p.querySelector('.cart-n input')
    let plus = cart_p.querySelector('.cart-n div:last-child')

    if(dfl!=0) number.value = dfl
    if(!begin) plusCart()

    min.addEventListener('click',minCart)
    plus.addEventListener('click',plusCart)

    function minCart(){
        number.value--
        if(number.value<1) removeCart()
        if(number.value>=0) up()      
    }
    async function plusCart(){
        if(number.value!=stock){
            number.value++
            up()
        }
    }
    function removeCart(){
        if(cartlist) e.closest('section').remove()

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

    async function up(){
        if(cartlist){
            try{
                let price = e.closest('section').getAttribute('data-price')
                e.closest('section').querySelector('.price').innerHTML= `${number.value} x ${num2rupiah(price)} = ${num2rupiah(price*number.value)}`
                checkarticlebox()
                document.querySelector('.cobx .cart').classList.add('loading')
                document.querySelector('.cobx .sumCart').classList.add('loading')
                document.querySelector('.cobx .button').innerHTML = 'Memuat'
                document.querySelector('.cobx .button').classList.add('pointereventnone')
            }catch(e){}
        }

        let ft = await fetch('/cart',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body : JSON.stringify({'id':id , 'total' : number.value})
        }).then(res=>{
            notif('Keranjang berhasil diperbarui')  
            return res.json()
        })
        try{
            cart.innerHTML = num2rupiah(ft.totHarga)
            document.querySelector('.cart span').innerHTML = ft.count
            unloading(document.querySelector('.cobx'))
            document.querySelector('.cobx .button').innerHTML = 'Checkout'
            document.querySelector('.cobx .button').classList.remove('pointereventnone')
        }catch(e){}
    }
}

function unloading(e){
    e.querySelectorAll('*').forEach(el=>el.classList.remove('loading'))
}

function num2rupiah(number){
    return (!Number.isInteger(number))? number :  new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"})
     .format(number)
     .replace('IRD','Rp.')
     .replace(',00','') || number
}

function rupah2num(number){
    return Number(number.replace('Rp&nbsp;','').replace('.',''))
}

function login(){
    let isi = `
    <div class="webName flex-left" href="/">
        <img src="img/plant.svg" width="35"  alt="">
        <h3>PEKEN</h3>
    </div>
    <h3>Login untuk mulai berbelanja</h3>
    <a class="google-button" href="/login">
        <img src="img/logo-google-outline.svg" height="18" alt="">
        <p>Masuk dengan akun Google</p>
    </a>
    `
    modal(isi,'login')
}

function myaccount(e){
    let name  = e.getAttribute('data-name')
    let isi = `
    <h2>${name}</h2>
    <a href = "/cart" >Keranjang saya</a>
    <a href = "/order" >Pesanan saya</a>
    <a href = "/logout" >Log out</a>
    `
    modal(isi , 'profile')
}

function modal(isi,kelas,cross=true){
    let bg = document.createElement('div')
    bg.classList.add('bgmodal')

    let modal = document.createElement('div')
    modal.classList.add('modal')
    modal.classList.add(kelas)

    modal.innerHTML= isi
    
    if(cross) modal.innerHTML+='<img src="img/plus.svg" class="closeModal" alt="">'

    document.querySelector('body').appendChild(bg)
    document.querySelector('body').appendChild(modal)
    if(cross) bg.addEventListener('click',close,{once:true})
    if(cross) modal.querySelector('.closeModal').addEventListener('click',close,{once:true})

    document.querySelectorAll('nav,main').forEach(el=>{el.style.filter = 'blur(1px)' })   
    
    function close(){
        modal.animate([
            {},
            {   opacity: 0,
                transform: 'translateY(-150%) scale(0.85)' 
            }
            ], {
                easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            duration: 300,
            iterations: 1
            })

        setTimeout(()=>{
            document.querySelectorAll('nav,main').forEach(el=>{el.style.filter = 'none' }) 
            bg.remove()
            modal.remove()
        },300)
    }
}

function notif(message){
    let notiflain = document.querySelectorAll('.notif')
    if(notiflain.length)if(notiflain[notiflain.length-1].innerHTML==message) return

    let notif = document.createElement('div')
    notif.classList.add('notif')
    notif.innerHTML = message

    document.querySelector('body').appendChild(notif)  

    setTimeout(()=>{closenotif(notif)},4000)

    function closenotif(ell){
        ell.animate([
            {},
            {   
                opacity: 0,
                transform: 'translateY(-150%) scale(0.85)' 
            }
            ], {
            easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            duration: 300,
            iterations: 1
            })
        setTimeout(()=>{ell.remove()},300)
    }
}
function copy(e){
    var r = document.createRange();
    r.selectNode(e.parentElement.querySelector('b'));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    notif('Tersalin')
}