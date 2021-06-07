loading()
document.querySelector('.editAlamat').addEventListener('click',(e)=>{
    let isi =`
        <div>
            <div class="flex-between">
                <h4>Ubah Alamat Pengiriman</h4>
            </div>
        </div>
        <div class="alamatbox">
            <form onsubmit="savealamat(this); return false;">
                <input type="text"  placeholder="Nama penerima" name='name' autofocus required>
                <input type="tel" placeholder="Nomor HP" name='hp' required>
                <select disabled name="provinsi" id="provinsi" required>
                    <option value="">-- Provinsi --</option>
                </select>
                <br>
                <select disabled name="kabupaten" id="kota_kabupaten" required>
                    <option value="">-- Kabupaten --</option>
                </select>
                <br>
                <select disabled name="kecamatan" id="kecamatan" required>
                    <option value="">-- Kecamatan  --</option>
                </select>
                <br>
                <select disabled name="kelurahan" id="kelurahan" required>
                    <option value="">-- Desa/Kelurahan --</option>
                </select>
                <br>
                <input type="text" placeholder="Nama Jalan" name="jalan" required>
                <input type="number" placeholder="Kode Pos" name="postal_code" required>
                <div class="flex-right" >
                    <input type="submit" class="button" value="simpan">
                </div>
            </form>
            
        </div>
        
    `

    modal(isi,'alamat')

    alamat()
})




async function alamat(){
    let url = {
        provinsi : 'https://dev.farizdotid.com/api/daerahindonesia/provinsi',
        kota_kabupaten : 'https://dev.farizdotid.com/api/daerahindonesia/kota?id_provinsi=',
        kecamatan : 'https://dev.farizdotid.com/api/daerahindonesia/kecamatan?id_kota=',
        kelurahan : 'https://dev.farizdotid.com/api/daerahindonesia/kelurahan?id_kecamatan=',
    }

    if(document.querySelector('#provinsi').value == "") set('provinsi')

    async function set(apa,id=''){
        let data = await fetch(url[apa]+id).then(res=>res.json()).then(res=>res[apa])
        let ell = document.querySelector('#'+apa)
        ell.innerHTML=`<option value="">-- ${apa} --</option>`
        
        data.forEach(e=>{
            let n = document.createElement('option')
            n.setAttribute('value', e.id)
            n.innerHTML = e.nama
            ell.appendChild(n)
    
        })
        ell.removeAttribute('disabled')
        ell.onchange = ()=>{
            let arr = Object.keys(url)
            if(arr[arr.indexOf(apa)+1]){
                set(arr[arr.indexOf(apa)+1],ell.value)
                ell.parentElement.querySelectorAll('#'+arr.slice(arr.indexOf(apa)+1,4).join(' ,#')).forEach(el=>{
                    el.innerHTML=`<option>-- ${el.id} --</option>`
                    el.disabled = true
                })
            }
        }
    }
}

async function savealamat(e){
    e.querySelector('.button').value='Menyimpan ...'
    e.querySelector('.button').disabled = true
    let data =  Object.fromEntries(new FormData(e).entries())

    fetch('/setaddress',{
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify(data)
    }).then(res=>res.json()).then(res=>{
        console.log(res)
        if(res.status==='success'){
            e.closest('.modal').querySelector('.closeModal').click()
            e.querySelector('.button').value='Simpan'
            e.querySelector('.button').disabled = false
            document.querySelector('.alamatdisp').innerText=res.strAddress
            getOngkir()
        }
    })
    return false
}



document.querySelectorAll('.medBayar div input').forEach(inp=>{
    inp.onchange=(el)=>{
        let pilih = el.target.parentElement.parentElement.querySelector('.pilih')
        document.querySelectorAll('.medBayar .pilih').forEach(ell=>{
            ell.style.display = 'none'
            ell.querySelector('select').value=''
            ell.querySelector('.ket').style.display='none'
            ell.querySelector('select').required=false
        })
        pilih.style.display = 'block'
        pilih.querySelector('select').required = true

        pilih.querySelector('select').onchange=(e)=>{
            let terpilih = e.target.value
            let ket  = pilih.querySelector('.ket')
            ket.innerHTML=`
                <ol type="1" style="margin-left:15px">
                    <li style="margin-bottom:5px ;font-size:11px">Periksa kembali data pembayaran Anda sebelum melanjutkan transaksi.</li>
                    <li style="font-size:11px">Gunakan kode pembayaran ${e.target.value}${(el.target.value !=='store')?' Virtual Account':''} untuk membayar transaksi ini</li>
                </ol>`

            ket.style.display='block'
        }
    }
})

function bayar(e){
    const query = new URLSearchParams()
    const params = (Object.fromEntries(new FormData(e).entries()))
    Object.keys(params).forEach(key => query.append(key, params[key]));
    console.log(query.toString())
    fetch('/bayar?'+query).then(res=>res.json()).then(res=>{
        if(res.error){
            if(!e.querySelector('.error')){
                let err = document.createElement('p')
                err.classList.add('error')
                err.innerText=res.error
                e.insertBefore(err, e.lastElementChild);
            }else{
                e.querySelector('.error').innerText=res.error
            }
            setTimeout(()=>{
                e.querySelector('.error').remove()
            },10000)
        }else{
            window.location = res;
        
        }

        

    })
}
getProduct()
async function getProduct(){
 
    let dataft = await fetch(`http://localhost:5000/cartlist`).then(res=>res.json())
    let data = dataft.data
    let sum = dataft.totHarga.totHarga

    console.log(sum)
    if(data.length>3){
        for(let i = 0 ; i<data.length-3 ; i++){
            let templet = document.createElement('section')
            templet.classList.add('product-c')
            templet.classList.add('flex-left')
            templet.innerHTML = `
                <img src="image-data/default-placeholder.png" height="100" class="productImage" alt="">
                <div>
                    <p class="name">Lorem ipsum dolor sit. lorem</p>
                    <p class="price" data-sum=0>3 x Rp 000.000 = Rp. 1.000.000</p>
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

        let element = e.querySelectorAll("a,.productImage,p,.button")
        console.log(element)
        element[0].setAttribute('src' , `image-data/${JSON.parse(data[i].image).file}`)
        element[0].setAttribute('alt' , JSON.parse(data[i].image).alt)
        element[1].innerHTML = data[i].productName
        element[2].innerHTML = `${data[i].oncart} x ${num2rupiah(data[i].price)} = ${num2rupiah(data[i].price*data[i].oncart)}`

        setTimeout(()=>unloading(e),i*100)
    });    
    getOngkir()
}
async function getOngkir(){
    let rincian = document.querySelectorAll('.rincianBay b')
    rincian.forEach(e=>e.classList.add('loading'))
    let ongkir = await fetch('/getOngkir').then(res=>res.json())

    rincian[0].innerText = num2rupiah(ongkir.totHarga)
    rincian[1].innerText = (!ongkir.error)? num2rupiah(ongkir.ongkir) : ongkir.error
    rincian[2].innerText = (!ongkir.error)? num2rupiah(ongkir.totBayar) : ongkir.error

    rincian.forEach(e=>e.classList.remove('loading'))
}