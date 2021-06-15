getProduct()

async function getProduct(){
    let dataft = await fetch(`/cartlist`).then(res=>res.json())
    let data = dataft.data
    let sum = dataft.totHarga

    if(data.length==0){
        empty()
        return
    }

    if(data.length>3){
        for(let i = 0 ; i<data.length-3 ; i++){
            let box = document.querySelector('.box-product-cart')
            box.appendChild(box.lastElementChild.cloneNode(true))
        }
    }

    let sectionBox = document.querySelectorAll('.box-product-cart .product-c')
    sectionBox.forEach((e,i) => {
        if(data[i]==undefined) {
            e.remove()
            let more = document.querySelector('.more')
            if(more) more.remove()
            return
        }
        e.setAttribute('data-id',data[i].id)
        e.setAttribute('data-price',data[i].price)
        e.setAttribute('data-stock',data[i].stock)

        let element = e.querySelectorAll("a,.productImage,p,.button")

        element[0].setAttribute('href',`/d/product-${data[i].id}`)
        element[1].setAttribute('src' , `image-data/${data[i].image.file}`)
        element[1].setAttribute('alt' , data[i].image.alt)
        element[2].setAttribute('href',`/d/product-${data[i].id}`)
        element[3].innerHTML = data[i].productName
        element[4].innerHTML = `${data[i].oncart} x ${num2rupiah(data[i].price)} = ${num2rupiah(data[i].price*data[i].oncart)}`
        element[6].innerHTML = `tersedia ${data[i].stock} ${data[i].units}`

        addCart(element[5],data[i].oncart,true,true)

        setTimeout(()=>{
            element[1].classList.toggle('loadimage')
            setTimeout(()=>element[1].classList.toggle('loadimage'),600)
            unloading(e)
        },i*100+200)
    });    
    document.querySelector('.cobx .cart span').innerHTML = sum.count
    document.querySelector('.cobx .sumCart').innerHTML = num2rupiah(sum.totHarga)
    document.querySelector('.cobx .button').innerHTML = 'Checkout'
    document.querySelector('.cobx .button').classList.remove('pointereventnone')
    unloading(document.querySelector('.cobx'))
}

function removecart(e){
    e.parentElement.querySelector('.cart-n > input').value = 1
    e.parentElement.querySelector('.cart-n > div:first-child').click()
    checkarticlebox()
}
function checkarticlebox(){
    if(document.querySelector('.box-product-cart').innerText=='') empty()
}

function empty(){
    document.querySelector('article').innerHTML=`
    <div class="empty">
        <img src="img/empty.png" height="140" alt="">
        <h3>Tidak ada item di keranjang ada</h3>
    </div>
    `
    document.querySelector('.cobx').remove()
}

