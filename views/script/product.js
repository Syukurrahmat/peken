loading()
getProduct(0,20,true)

async function getProduct(offset,many,begin=false){
    let category = new URL (window.location.href).pathname.split('/')
    category =  category[category.length-1]
    let queryCheck = new URLSearchParams(window.location.search)
    let sort = (queryCheck.get('sortby'))? queryCheck.get('sortby') : 'none-none'
    let key = (queryCheck.get('key'))? queryCheck.get('key') : 'none'

    let data = await fetch(`http://localhost:5000/getProduct?c=${category}&offset=${offset}&many=${many}&sortby=${sort}&key=${key}`).then(res=>res.json()).then(res=>res.data)
    
    if(data.length==0 && begin==true){
        document.querySelector('article').innerHTML=`
            <div class="empty">
            <img src="img/empty.png" height="140" alt="">
            <h3>Produk tidak ditemukan </h3>
            <p>Mohon coba kata kunci yang lain atau yang lebih umum</p>
            </div>`
        return
    }

    let sectionBox = Array.from(document.querySelectorAll('.box-product .product')).slice(offset, offset+many);
    sectionBox.forEach((e,i) => {
        if(data[i]==undefined) {
            e.remove()
            let more = document.querySelector('.more')
            if(more) more.remove()
            return
        }
        e.setAttribute('data-id',data[i].id)
        e.setAttribute('data-stock',data[i].stock)

        let element = e.querySelectorAll(".productImage,p,button")
        let link = e.querySelectorAll('a')

        link.forEach(e=>e.setAttribute('href',`/d/product-${data[i].id}`))

        let imgFile = JSON.parse(data[i].image) 
        let price = num2rupiah(data[i].price)
    
        element[0].setAttribute('src' , `image-data/${imgFile.file}`)
        element[0].setAttribute('alt' , imgFile.alt)
        element[1].innerHTML = data[i].productName
        element[2].innerHTML = data[i].note
        element[3].innerHTML = price

        if(data[i].oncart) addCart(element[4],data[i].oncart,true)

        setTimeout(()=>unloading(e),i*100)
    });    
}

function more(){
    let offset =document.querySelectorAll('.box-product .product').length     
    let box = document.querySelector('.box-product')
    for(let i = 0 ; i<15 ; i++){

    let templet = document.createElement('section')
    templet.classList.add('product')
    templet.innerHTML = `
            <a href="" class='loading' >
                <img src="image-data/default-placeholder.png" class="productImage loading" alt="Pisang Raja Sereh sisir">
            </a>
            <div class="labelProduct">
                <div class="nameProduct">
                    <a href="" class="loading">
                        <p class="name loading">Lorem ipsum dolor sit.</p>
                    </a>
                    <p class="note loading">Lorem, ipsum.</p>
                </div>
                <div class="bawah flex-between">
                    <p class="price loading" data-sum="0">Rp 000.000</p>
                    <div class="cart-p">
                        <button class="button loading" onclick="addCart(this)">+ keranjang</button>
                        <div class="cart-n flex-between" >
                            <div>-</div>
                            <input type="number" value="0">
                            <div>+</div>
                        </div>
                        
                    </div>
                </div>
            </div>
    `
        box.appendChild(templet)
    }
    getProduct(offset,15)
}

function reloadProduct(){
    document.querySelectorAll('.box-product .cart-p').forEach(e=>{
        e.children[0].style.display = 'block'
        e.children[1].style.display = 'none'
    })
    let el = document.querySelector('.box-product')
    el.parentNode.replaceChild(el.cloneNode(true), el);
    loading()
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
        let countSection = document.querySelectorAll('.box-product .product').length
        let sortby = e.target.getAttribute('data-sort')
        elm.querySelector('.option').classList.remove('show')
        
        reloadProduct()
        plusQuery('sortby',sortby)
        getProduct(0,countSection)

        input.value = e.target.innerHTML
        elm.querySelectorAll('.option div').forEach(div=> div.removeEventListener('click',pilih))
    }
}

function plusQuery(prop,val) {
    let param =''
    let url = window.location.href
    let pagesearch = url.includes('search')
    let path = (pagesearch)? url.split('&')[0]  : new URL(url).pathname
    
    if(val!=='none'){
        param = new URLSearchParams(window.location.search)
        param.delete('key')
        if(param.has(prop)){
            param.set(prop,val)
        }else{
            param.append(prop,val)
        }
        param = (pagesearch)? "&" + param.toString() :  "?" + param.toString()
    }

    let newUrl = path + param

    var obj = { Title: 'Peken - Belanja buah dan sayur pilihan dengan kualitas segar dan harga terjangkau', path : newUrl  };
    window.history.pushState({}, obj.Title, obj.path);
}