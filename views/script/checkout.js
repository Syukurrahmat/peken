function editalamat(){
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
}

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
    let buttonAlamat = document.querySelector('.editAlamat')
    let alamatdisp = document.querySelector('.alamatdisp')
    let submitbutton = document.querySelector('.total')

    e.closest('.modal').querySelector('.closeModal').click()
    buttonAlamat.innerHTML = 'Menyimpan ...'
    submitbutton.value = 'Menyimpan Alamat'
    buttonAlamat.classList.add('pointereventnone')
    submitbutton.classList.add('pointereventnone')
    alamatdisp.classList.add('loading')    
    document.querySelectorAll('.rincianBay b').forEach(e=>e.classList.add('loading'))

    let data =  Object.fromEntries(new FormData(e).entries())

    fetch('/setaddress',{
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify(data)
    }).then(res=>res.json()).then(res=>{
        if(res.status==='success'){
            buttonAlamat.classList.remove('pointereventnone')
            buttonAlamat.innerHTML = 'Ubah Alamat'
            alamatdisp.innerHTML = res.strAddress
            alamatdisp.classList.remove('loading')
            notif('Alamat baru berhasil disimpan')
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
    let isi =`
    <img src="img/Dual Ring-0.8s-200px.svg" height="120" alt="">
    <h3>Memproses Pesanan Anda</h3>
    `
    modal(isi,'empty',false)
    
    const query = new URLSearchParams()
    const params = (Object.fromEntries(new FormData(e).entries()))
    Object.keys(params).forEach(key => query.append(key, params[key]));

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
            document.querySelectorAll('.modal, .bgmodal').forEach(el=>el.remove())
            document.querySelectorAll('*').forEach(el=>el.style.filter=null)
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
 
    let dataft = await fetch(`/cartlist`).then(res=>res.json())
    let data = dataft.data
    let sum = dataft.totHarga.totHarga

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

        let element = e.querySelectorAll(".productImage,p,.button")
        element[0].setAttribute('src' , `image-data/${data[i].image.file}`)
        element[0].setAttribute('alt' , data[i].image.alt)
        element[1].innerHTML = data[i].productName
        element[2].innerHTML = `${data[i].oncart} x ${num2rupiah(data[i].price)} = ${num2rupiah(data[i].price*data[i].oncart)}`

        setTimeout(()=>{
            element[0].classList.toggle('loadimage')
            setTimeout(()=>element[0].classList.toggle('loadimage'),600)
            unloading(e)
        },i*100+200)
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

    document.querySelector('.total').value = (!ongkir.error)? 'BAYAR ' + num2rupiah(ongkir.totBayar) : ongkir.error
    if(!ongkir.error) document.querySelector('.total').classList.remove('pointereventnone')

    rincian.forEach(e=>e.classList.remove('loading'))
}