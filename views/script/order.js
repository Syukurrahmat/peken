getdata()
async function getdata(){
    let dt = await fetch('/getorders').then(res=>res.json())

    if(dt.length==0) return document.querySelector('.pesananbox').innerHTML = `
        <div class="empty">
        <img src="img/empty.png" height="140" alt="">
        <h3>Anda belum memiliki pesanan</h3>
        </div>
    `
    let data = []

    data[0] = dt.filter(e=>e.status == 'yet')
    data[1] = dt.filter(e=>e.status == 'paid')
    data[2] = dt.filter(e=>e.status == 'expired')
    
    let box = document.querySelectorAll('.belumbayar , .sudahbayar , .kadaluarsabayar')
    let tot = document.querySelectorAll('.totpes span')
    let status = {yet : ['Belum dibayar','yellowBox'] , paid : ['Sudah dibayar','greenBox'] , expired: ['Dibatalkan' , 'redBox']}
    
    data.forEach((e,i)=>{

        if(e.length==0){
            box[i].remove()
        }

        if(e.length > 1){
            for(let j= 0 ; j<e.length-1 ;j++){
                box[i].appendChild(box[i].lastElementChild.cloneNode(true))
            }
        }
        
        box[i].querySelectorAll('section').forEach((section,i)=>{
            if(e[i]==undefined) return section.remove()
            let element = section.querySelectorAll('b ,p ,.button')
            element[1].innerHTML = e[i].id
            element[2].innerHTML = isoToDate(e[i].createdAt)
            element[4].innerHTML = status[e[i].status][0]
            element[4].className = status[e[i].status][1]
            element[6].innerHTML = toFullTanggal(e[i].deadline)
            element[8].innerHTML = e[i].method
            element[9].innerHTML = e[i].payment_code
            element[12].innerHTML = num2rupiah(e[i].bayar.totBayar)
            element[13].setAttribute('data-id' , e[i].id)
            unloading(section)
        })

        tot[i].innerHTML = e.length
    })
}

function toFullTanggal(dt){
    let bulanArr = ['Januari', 'Februari', 'Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    let xbulan = new Date(dt).getMonth();
    
    let jam = String(new Date(dt).getHours()).padStart(2,0)
    let menit = String(new Date(dt).getMinutes()).padStart(2,0)
    let tanggal = new Date(dt).getDate();
    let bulan = bulanArr[xbulan];
    let tahun = new Date(dt).getFullYear();

    return (`${jam}:${menit} , ${tanggal} ${bulan} ${tahun}`);
}

function isoToDate(iso){
    let bulanArr = ['Januari', 'Februari', 'Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    let date = iso.split('T')[0].split('-')
    let time = iso.split('T')[1].split(':').slice(0,2).join(':')
        
    return (`${time} , ${date[2]} ${bulanArr[Number(date[1])]} ${date[0]}`);
}

async function detail(e){
    let isi = `
    <div>
        <h4>Detail Pesanan</h4>
        <div class="flex-between">
            <p >Status Pesanan</p>
            <p class="loading">Pesanan Kedaluwarsa</p>
        </div>
        <div class="flex-between">
            <p>Tanggal Pesanan</p>
            <p class="loading">Tanggal Pesanan</p>
        </div>
        <div class="flex-between">
            <p>Tanggal diterima</p>
            <p class="loading">Tanggal Pesanan</p>
        </div>
    </div>
    <div>
        <h4>Alamat pengiriman</h4>
        <p class="loading">tetur adipisicing elit. Ex, quos.</p>
        <p class="loading">Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex, quos.</p>
    </div>
    <div>
        <h4>Daftar Barang</h4>
        <div class="box-product-cart ">
            <section class="product-c flex-left">
                <div class='loading'>
                    <img src="image-data/default-placeholder.png" height="100" class="productImage" alt="">
                </div>
                <div>
                    <a class="name loading">Lorem ipsum dolor sit. lorem</a>
                    <p class="price loading" data-sum=0>3 x Rp 000.000 = Rp. 1.000.000</p>
                </div>
            </section>
        </div>
    </div>
    <div class=rincianBay>

        <h4>Rincian Pembayaran</h4>
        <div class="flex-between">
            <p>Total Belanja</p>
            <b class="loading">Rp.23.000</b>
        </div>
        <div class="flex-between">
            <p>Ongkos Kirim</p>
            <b class="loading">Rp.23.000</b>
        </div>
        <div class="flex-between">
            <p>Total Pembayaran</p>
            <b class="loading">Rp.23.000</b>
        </div>
    </div>
    `
    modal(isi,'detailpesanan')
    let data = await fetch('/getdetailorder'+e.getAttribute('data-id')).then(res=>res.json())
    let status = {yet : ['Belum dibayar','yellowBox'] , paid : ['Sudah dibayar','greenBox'] , expired: ['Dibatalkan' , 'redBox']}

    let element = document.querySelector('.detailpesanan').querySelectorAll('p , b, .box-product-cart')

    element[1].innerHTML = status[data.status][0]
    element[1].classList.add(status[data.status][1])
    element[3].innerHTML = isoToDate(data.createdAt)
    element[5].innerHTML = (data.accepted)? toFullTanggal(data.accepted) : 'Barang belum diterima'  
    element[6].innerHTML = data.address.strAddress.split('|')[0]
    element[7].innerHTML = data.address.strAddress.split('|')[1]
    element[11].innerHTML = num2rupiah(data.bayar.totHarga)
    element[13].innerHTML = num2rupiah(data.bayar.ongkir)
    element[15].innerHTML = num2rupiah(data.bayar.totBayar)
   
    if(data.listBarang.length>1){
        for(let i = 0 ; i<data.listBarang.length-1 ; i++){
            element[8].appendChild(element[8].lastElementChild.cloneNode(true))
        }
    }
    let listjumlah = data.list

    data.listBarang.forEach((e,i)=>{
        let elm = element[8].children[i].querySelectorAll('img,a,p')
        elm[0].setAttribute('src','image-data/'+e.image.file)
        elm[0].setAttribute('alt',e.image.alt)
        elm[1].innerHTML = e.productName
        elm[2].innerHTML = `${(listjumlah[e.id])} x ${num2rupiah(e.price)} = ${num2rupiah(listjumlah[e.id]*e.price)}`
    })
    unloading(document.querySelector('.detailpesanan'))
}