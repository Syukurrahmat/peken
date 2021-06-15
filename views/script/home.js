initTopProduct()
async function initTopProduct(){
    let data = await fetch('http://localhost:5000/topProduct').then(res=>res.json()).then(res=>res.data)
    console.log(data)
    let sectionBox = document.querySelectorAll('.box-product section')
    sectionBox.forEach((e,i) => {
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