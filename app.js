// app.js - نسخة مُعدّلة وصالحة للعمل مع HTML المرسل

// عناصر DOM الرئيسية
const bookContainer = document.getElementById('bookContainer');
const paginationContainer = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');

const bookModal = document.getElementById('bookModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalAuthor = document.getElementById('modalAuthor');
const modalStatus = document.getElementById('modalStatus');
const modalRating = document.getElementById('modalRating');
const bookNotes = document.getElementById('bookNotes');
const closeModalBtn = document.getElementById('closeModal');

const bookForm = document.getElementById('bookForm');
const bookDialog = document.getElementById('bookDialog');
const addBookBtn = document.querySelector('.btn-p');
const dialogTitle = document.getElementById('dialogTitle');

const confirmDeleteDialog = document.getElementById('confirmDeleteDialog');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

const filterList = document.getElementById('filterList');
const burgerMenu = document.getElementById('burgerMenu');
const menuBar = document.querySelector('.menu-bar');
const menuOverlay = document.getElementById('menuOverlay');
const themeToggle = document.getElementById('themeToggle');

let books = JSON.parse(localStorage.getItem('books')) || [];
let editingId = null;
let bookIdToDelete = null;

let currentPage = 1;
const booksPerPage = 10;
let currentFilter = 'all'; // 'all' or 'want to read' or 'finished' or 'favorites'

// ====== ثيم ابتدائي من localStorage ======
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
})();

// ====== حدث تبديل الثيم (sun / moon toggle) ======
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// ====== فتح وغلق دياالوج الكتاب ======
addBookBtn.addEventListener('click', () => openBookDialog());

function openBookDialog(book = null) {
  if (book) {
    dialogTitle.textContent = "Edit Book";
    document.getElementById('bookTitle').value = book.title || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookRating').value = book.rating || '1';
    document.getElementById('bookStatus').value = book.status || 'want to read';
    editingId = book.id;
  } else {
    dialogTitle.textContent = "Add New book";
    bookForm.reset();
    editingId = null;
  }
  bookDialog.showModal();
}

function closeTaskDialog() {
  bookDialog.close();
  bookForm.reset();
  editingId = null;
}

// ====== حفظ/تحديث كتاب ======
function saveBooksToStorage() {
  localStorage.setItem('books', JSON.stringify(books));
}

bookForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const rating = parseInt(document.getElementById('bookRating').value) || 1;
  const status = document.getElementById('bookStatus').value.trim();

  const fileInput = document.getElementById('book-image');
  const file = fileInput && fileInput.files[0];

  function finalizeSave(imageData) {
    if (editingId) {
      books = books.map(b => b.id === editingId ? { ...b, title, author, rating, status, image: imageData } : b);
    } else {
      const newBook = {
        id: Date.now(),
        title, author, rating, status,
        image: imageData || '',
        isFavorite: false,
        notes: ''
      };
      books.push(newBook);
    }
    saveBooksToStorage();
    renderBooks();
    closeTaskDialog();
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      finalizeSave(ev.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    // لو بدون صورة: خذ الصورة القديمة لو كنا نعدّل
    let image = '';
    if (editingId) {
      const book = books.find(b => b.id === editingId);
      image = book ? book.image : '';
    }
    finalizeSave(image);
  }
});

// ====== حذف كتاب مع تأكيد ======
function deleteBook(id) {
  bookIdToDelete = id;
  confirmDeleteDialog.showModal();
}
cancelDeleteBtn.addEventListener('click', () => {
  confirmDeleteDialog.close();
  bookIdToDelete = null;
});
confirmDeleteBtn.addEventListener('click', () => {
  if (bookIdToDelete !== null) {
    books = books.filter(b => b.id !== bookIdToDelete);
    saveBooksToStorage();
    renderBooks();
    bookIdToDelete = null;
    confirmDeleteDialog.close();
  }
});

// ====== تعديل كتاب (يفتح الدياالوج مع بيانات الكتاب) ======
function editBook(id) {
  const book = books.find(b => b.id === id);
  if (book) openBookDialog(book);
}

// ====== فتح تفاصيل (المودال) و حفظ الملاحظات ======
function openDetailsDialog(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  modalImage.src = book.image || 'https://via.placeholder.com/100x150?text=No+Image';
  modalTitle.textContent = book.title;
  modalAuthor.textContent = book.author;
  modalStatus.textContent = book.status;
  modalRating.textContent = '⭐'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
  bookNotes.value = book.notes || '';
  // خزن id في الزر عشان نستخدمه لاحقًا
  document.getElementById('saveNotesBtn').dataset.bookId = bookId;
  bookModal.classList.remove('hidden');
}

document.getElementById('saveNotesBtn').addEventListener('click', () => {
  const bookId = parseInt(document.getElementById('saveNotesBtn').dataset.bookId);
  const idx = books.findIndex(b => b.id === bookId);
  if (idx === -1) return;
  books[idx].notes = bookNotes.value.trim();
  saveBooksToStorage();
  renderBooks();
  bookModal.classList.add('hidden');
});

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    bookModal.classList.add('hidden');
  });
}

// ====== تفضيل / إلغاء تفضيل ======
function toggleFavorite(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  book.isFavorite = !book.isFavorite;
  saveBooksToStorage();
  renderBooks();
  // اختياري: إشعار بسيط
  // alert(book.isFavorite ? `تمت إضافة "${book.title}" إلى المفضلة` : `تمت إزالة "${book.title}" من المفضلة`);
}

// جعل الدوال متاحة للسطر HTML (عشان أزرار inline)
window.toggleFavorite = toggleFavorite;
window.editBook = editBook;
window.deleteBook = deleteBook;
window.openDetailsDialog = openDetailsDialog;

// ====== فلترة و رندر الكتب مع pagination ======
function renderBooks(overrideBooks = null) {
  bookContainer.innerHTML = '';
  // اختار مجموعة الكتب بناءً على البحث أو الفلتر
  let filtered = overrideBooks !== null ? overrideBooks.slice() : books.slice();

  if (overrideBooks === null) {
    // فلترة حسب currentFilter (جمع بها أحرف صغيرة لترابط)
    const cf = (currentFilter || 'all').toLowerCase();
    if (cf === 'favorites') {
      filtered = filtered.filter(b => b.isFavorite);
    } else if (cf === 'want to read') {
      filtered = filtered.filter(b => (b.status || '').toLowerCase() === 'want to read');
    } else if (cf === 'finished') {
      filtered = filtered.filter(b => (b.status || '').toLowerCase() === 'finished');
    }
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / booksPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * booksPerPage;
  const paginated = filtered.slice(start, start + booksPerPage);

  if (paginated.length === 0) {
    bookContainer.innerHTML = '<p>no result</p>';
  } else {
    paginated.forEach(book => {
      const stars = '⭐'.repeat(book.rating) + '☆'.repeat(5 - book.rating);

      const card = document.createElement('div');
      card.className = 'book-card';

      card.innerHTML = `
        <div class="img-box">
          <img src="${book.image || 'https://via.placeholder.com/100x150?text=No+Image'}" alt="Book Cover" class="book-cover">
        </div>
        <div class="card-content">
          <p><strong>${escapeHtml(book.title)}</strong></p>
          <p>${escapeHtml(book.author)}</p>
          <p>Rate: <span class="stars">${stars}</span></p>
          <p>Status: ${escapeHtml(book.status)}</p>
        </div>
        <div class="book-actions">
          <button class="favorite-btn icon" onclick="toggleFavorite(${book.id})">
            <i class="fas fa-heart  ${book.isFavorite ? 'favorite-active' : ''}"></i>
          </button>
          <button class="icon" onclick="editBook(${book.id})"><i class="fas fa-edit "></i></button>
          <button class="icon" onclick="deleteBook(${book.id})"><i class="fas fa-trash-alt "></i></button>
          <button class="notes-btn icon" onclick="openDetailsDialog(${book.id})"><i class="fa fa-file-text " aria-hidden="true"></i></button>
        </div>
      `;
      // لو ضغطت على الكارد نفسه (مو الأزرار) نفتَح التفاصيل:
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.book-actions')) {
          openDetailsDialog(book.id);
        }
      });
      bookContainer.appendChild(card);
    });
  }
  updateBookCounter();
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  paginationContainer.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = (i === currentPage) ? 'active' : '';
    btn.addEventListener('click', () => {
      currentPage = i;
      renderBooks();
    });
    paginationContainer.appendChild(btn);
  }
}

function updateBookCounter() {
  const completed = books.filter(b => (b.status || '').toLowerCase() === 'finished').length;
  const total = books.length;
  const completedCount = document.getElementById('completedCount');
  const totalCount = document.getElementById('totalCount');
  if (completedCount) completedCount.textContent = completed;
  if (totalCount) totalCount.textContent = total;
}

// ====== بحث حيّ (search) ======
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q === '') {
    currentPage = 1;
    renderBooks();
    return;
  }
  const result = books.filter(b =>
    (b.title || '').toLowerCase().includes(q) ||
    (b.author || '').toLowerCase().includes(q)
  );
  currentPage = 1;
  renderBooks(result);
});

// ====== فلتر القائمة (menu) ======
filterList.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    document.querySelectorAll('#filterList li').forEach(li => li.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = (e.target.dataset.filter || 'all').toLowerCase();
    currentPage = 1;
    renderBooks();
    // لو القائمة داخل وضع موبايل نغلقها:
    if (menuBar && menuBar.classList.contains('show')) {
      menuBar.classList.remove('show');
      if (menuOverlay) menuOverlay.classList.add('hidden');
    }
  }
});
//========btn up=======
const scrollTopBtn = document.getElementById('scrollTopBtn');
const addBookFloating = document.getElementById('addBookFloating');
const heroSection = document.querySelector('.hero-section');

window.addEventListener('scroll', () => {
  const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;

  if (window.scrollY > heroBottom) {
    scrollTopBtn.classList.add('show');
    addBookFloating.classList.add('show');
  } else {
    scrollTopBtn.classList.remove('show');
    addBookFloating.classList.remove('show');
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// لما تضغطين الزر العائم يفتح نفس الدياالوج حق إضافة كتاب
addBookFloating.addEventListener('click', () => {
  openBookDialog();
});


// ====== burger menu ======
if (burgerMenu) {
  burgerMenu.addEventListener('click', () => {
    menuBar.classList.toggle('show');
    menuOverlay.classList.toggle('hidden');
  });
}
if (menuOverlay) {
  menuOverlay.addEventListener('click', () => {
    menuBar.classList.remove('show');
    menuOverlay.classList.add('hidden');
  });
}

// ====== مساعدة: وظيفة هروب من XSS بسيطة عند إدخال نصوص المستخدم ======
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ====== شغّل الرندر الأولي ======
renderBooks();
