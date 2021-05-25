loading()

initTopProduct()
async function initTopProduct(){
    let data = await fetch('http://localhost:5000/topProduct').then(res=>res.json())
        .then(res=>res.data)
    
    let sectionBox = document.querySelectorAll('.box-product section')
    data.forEach(e=>console.log(e.oncart))
    sectionBox.forEach((e,i) => {
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

        if(data[i].oncart) addCart(element[4],data[i].oncart)
        setTimeout(()=>unloading(e),500)
    });

    
    
}