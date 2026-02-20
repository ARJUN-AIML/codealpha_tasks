const images = [
    {src:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', title:'Mountains', category:'nature'},
    {src:'https://images.unsplash.com/photo-1469474968028-56623f02e42e', title:'Forest', category:'nature'},

    {src:'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', title:'Skyscraper', category:'architecture'},
    {src:'https://images.unsplash.com/photo-1486718448742-163732cd1544', title:'Urban Lines', category:'architecture'},

    {src:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', title:'Smile', category:'people'},
    {src:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', title:'Portrait', category:'people'},

    {src:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', title:'Paris', category:'travel'},
    {src:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', title:'Journey', category:'travel'},

    {src:'https://images.unsplash.com/photo-1557672172-298e090bd0f1', title:'Minimal Art', category:'minimal'},
    {src:'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3', title:'Clean Space', category:'minimal'}
];

const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');

let filtered = images;
let currentIndex = 0;

function renderGallery() {
    gallery.innerHTML = '';
    filtered.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${img.src}" alt="${img.title}">`;
        div.onclick = () => openLightbox(i);
        gallery.appendChild(div);
    });
}

function openLightbox(i) {
    currentIndex = i;
    lightboxImg.src = filtered[i].src;
    lightboxTitle.textContent = filtered[i].title;
    lightbox.classList.add('active');
}

document.getElementById('closeBtn').onclick = () =>
    lightbox.classList.remove('active');

document.getElementById('prevBtn').onclick = () => {
    currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    openLightbox(currentIndex);
};

document.getElementById('nextBtn').onclick = () => {
    currentIndex = (currentIndex + 1) % filtered.length;
    openLightbox(currentIndex);
};

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const f = btn.dataset.filter;
        filtered = f === 'all' ? images : images.filter(i => i.category === f);
        renderGallery();
    };
});

renderGallery();
