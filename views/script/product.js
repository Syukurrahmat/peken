getProduct(0,20,true)

async function getProduct(offset,many,begin=false){
    let category = new URL (window.location.href).pathname.split('/')
    category =  category[category.length-1]
    let queryCheck = new URLSearchParams(window.location.search)
    let sort = (queryCheck.get('sortby'))? queryCheck.get('sortby') : 'none-none'
    let key = (queryCheck.get('key'))? queryCheck.get('key') : 'none'

    if(key=='none'){
        window.document.title = `Aneka ${(category=='all')? 'buah dan sayur' : category} pilihan | Peken`
    }else{
        window.document.title = `Hasil pencarian ${key} | Peken`
    }

    let data = await fetch(`/getProduct?c=${category}&offset=${offset}&many=${many}&sortby=${sort}&key=${key}`).then(res=>res.json()).then(res=>res.data)
    
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

        let element = e.querySelectorAll("a,.productImage,p,button")
        
        element[0].setAttribute('href',`/d/product-${data[i].id}`)
        element[2].setAttribute('href',`/d/product-${data[i].id}`)
        element[1].setAttribute('src' , `image-data/${data[i].image.file}`)
        element[1].setAttribute('alt' , data[i].image.alt)
        element[3].innerHTML = data[i].productName
        element[4].innerHTML = data[i].note
        element[5].innerHTML = num2rupiah(data[i].price)
        
        if(data[i].stock<=0)e.classList.add('soldout')
        if(data[i].oncart) addCart(element[6],data[i].oncart,true)
        
        setTimeout(()=>{
            element[1].classList.toggle('loadimage')
            setTimeout(()=>element[1].classList.toggle('loadimage'),600)
            unloading(e)
        },i*100+200)
    });    
}

function more(){
    let offset =document.querySelectorAll('.box-product .product').length     
    let box = document.querySelector('.box-product')
    for(let i = 0 ; i<15 ; i++){
        let br = box.lastElementChild.cloneNode(true)
        br.querySelector('img').setAttribute('src', "image-data/default-placeholder.png")
        br.querySelectorAll('a,p,.button').forEach(e=>e.classList.add('loading'))
        br.classList.remove('soldout')
        box.appendChild(br)
    }
    getProduct(offset,15)
}

function reloadProduct(){
    document.querySelectorAll('.box-product .cart-p').forEach(e=>{
        e.children[0].style.display = 'block'
        e.children[1].style.display = 'none'
    })
    let el = document.querySelector('.box-product')
    el.querySelectorAll('section').forEach(sec=>{
        sec.classList.remove('soldout')
        sec.querySelectorAll('a ,p, .button').forEach(elm=>{
            elm.classList.add('loading')
        })
    })
    el.parentNode.replaceChild(el.cloneNode(true), el);
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