let arr = window.location.href.replaceAll('/','-').replaceAll('?','-').split('-')
let id = arr[arr.indexOf('product')+1]
getRelated()
getdetail()
async function getdetail(){
    let data = await fetch(`/detail?id=${id}`).then(res=>res.json())
    console.log(data)

    let wr = document.querySelector('.display-product')
    wr.querySelector('section').setAttribute("data-id",data.id)
    wr.querySelector('section').setAttribute("data-stock",data.stock)

    let element = wr.querySelectorAll(".productImage, h1, p, button")

    element[0].setAttribute('src','image-data/'+ data.image.file)
    element[0].setAttribute('alt',data.image.alt)
    element[1].innerHTML = data.farm
    element[2].innerHTML = data.productName
    element[3].innerHTML = data.note
    element[4].innerHTML = `${num2rupiah(data.price)}   <span>/ ${data.units}</span>`
    element[6].innerHTML = `${data.stock} ${data.units} tersedia`
    element[7].innerHTML = data.description
    if(data.oncart) addCart(element[5],data.oncart,true)
    setTimeout(()=>{
        element[0].classList.toggle('loadimage')
        setTimeout(()=>element[0].classList.toggle('loadimage'),600)
        unloading(wr)
    },200)
    window.document.title = data.productName +' | Peken'

}

async function getRelated(){
    let data = await fetch(`/relateProduct?id=${id}`).then(res=>res.json()).then(res=>res.data)
    if(data.length==0){
        document.querySelector('.relateProduct').innerHTML = `
        <h4>Produk terkait</h4>
        <div class="empty">
        <p>Tidak ada produk terkait</p>
        </div>
        `
    return
    }

    let sectionBox = Array.from(document.querySelectorAll('.box-product .product'))
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
        
        if(data[i].stock<=0) e.classList.add('soldout')
        if(data[i].oncart) addCart(element[6],data[i].oncart,true)

        setTimeout(()=>{
            element[1].classList.toggle('loadimage')
            setTimeout(()=>element[1].classList.toggle('loadimage'),600)
            unloading(e)
        },i*100+200)
    });    
}
