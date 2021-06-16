function toFullTanggal(dt){
    let bulanArr = ['Januari', 'Februari', 'Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    let date = new Date(new Date(dt).toISOString()).toLocaleString()

    let tanggal = date.split(' ')[0].split('/')
    tanggal[1] = bulanArr[tanggal[1]-1]
    tanggal = tanggal.join(' ')
    let jam = date.split(' ')[1].split('.').slice(0,2).join(':')
    return (`${jam} , ${tanggal}`);

}

let deadline = document.querySelector('.deadline')
deadline.innerHTML = toFullTanggal(deadline.getAttribute('data-dt'))