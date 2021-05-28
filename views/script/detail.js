loading()

setTimeout(()=>{
    document.querySelectorAll('*').forEach(el=>el.classList.remove('loading'))
},500)

getRelated()
async function getRelated(){
    let arr = window.location.href.replaceAll('/','-').replaceAll('?','-').split('-')
    console.log(arr)
    let id = arr[arr.indexOf('product')+1]

    let data = await fetch(`http://localhost:5000/relateProduct?id=${id}`).then(res=>res.json()).then(res=>res.data)
    
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
