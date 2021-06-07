loading()
getProduct()

async function getProduct(){
 

    let dataft = await fetch(`http://localhost:5000/cartlist`).then(res=>res.json())
    let data = dataft.data
    let sum = dataft.totHarga
    console.log(data)
    if(data.length==0){
        empty()
        return
    }
    if(data.length>3){
        for(let i = 0 ; i<data.length-3 ; i++){
            let templet = document.createElement('section')
            templet.classList.add('product-c')
            templet.classList.add('flex-between')
            templet.innerHTML = `
            <a href="">
                <img src="image-data/default-placeholder.png" height="100" class="productImage" alt="">
            </a>
            <div class="flex-between labelProduct">
                <div>
                    <a href="">
                        <p class="name">Lorem ipsum dolor sit. lorem</p>
                    </a>
                    <p class="price" data-sum=0>3 x Rp 000.000 = Rp. 1.000.000</p>
                </div>
                <div class="flex-right">
                    <div class="closecart" onclick="removecart(this)">
                        <img src="img/trash-bin (1).svg" height="18" alt="">
                    </div>
                    <div>
                        <div class="cart-p flex-right">
                            <button class="button " onclick="addCart(this)" >+ keranjang</button>
                            <div class="cart-n flex-between">
                                <div>-</div>
                                <input type="number" value=0>
                                <div>+</div>
                            </div>
                        </div>
                        <p class="stock">tersedia 12 pcs</p>
                    </div>
                        
                </div>
            </div>
            `
            document.querySelector('.box-product-cart').appendChild(templet)
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
        console.log(element)
        element[0].setAttribute('href',`/d/product-${data[i].id}`)
        element[1].setAttribute('src' , `image-data/${JSON.parse(data[i].image).file}`)
        element[1].setAttribute('alt' , JSON.parse(data[i].image).alt)
        element[2].setAttribute('href',`/d/product-${data[i].id}`)
        element[3].innerHTML = data[i].productName
        element[4].innerHTML = `${data[i].oncart} x ${num2rupiah(data[i].price)} = ${num2rupiah(data[i].price*data[i].oncart)}`
        element[6].innerHTML = `tersedia ${data[i].stock} ${data[i].units}`

        addCart(element[5],data[i].oncart,true,true)

        setTimeout(()=>unloading(e),i*100)
    });    
    console.log(sum)
    document.querySelector('.cobx .cart span').innerHTML = sum.count
    document.querySelector('.cobx .sumCart').innerHTML = num2rupiah(sum.totHarga)
}

function removecart(e){
    e.parentElement.querySelector('.cart-n > input').value = 1
    e.parentElement.querySelector('.cart-n > div:first-child').click()
}
function checkarticlebox(){
    console.log('oooo')
    if(document.querySelector('.box-product-cart').innerText=='') empty()
}

function empty(){
    document.querySelector('article').innerHTML=`
    <div class="empty">
    <img src="img/empty.png" height="140" alt="">
    <h3>Tidak ada item di keranjang ada</h3>
    </div>`
    document.querySelector('.cobx').remove()
}

