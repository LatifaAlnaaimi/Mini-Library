

/***********theme selector**************************/
const themeSelect = document.getElementById('themeSelect');
const bookContainer = document.getElementById('bookContainer');
const paginationContainer = document.getElementById('pagination');
const searchInput = document.getElementById("searchInput");

/********************************* */
const bookModal = document.getElementById('bookModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalAuthor = document.getElementById('modalAuthor');
const modalStatus = document.getElementById('modalStatus');
const modalRating = document.getElementById('modalRating');
const bookNotes = document.getElementById('bookNotes');
const closeModalBtn = document.getElementById('closeModal');
/********************************* */

let tasks = [];
let editingTaskId = null;

let currentPage = 1;
const booksPerPage = 10;

themeSelect.addEventListener('change', function () {
  const selectedTheme = this.value;
  document.documentElement.setAttribute('data-theme', selectedTheme);
  localStorage.setItem('theme', selectedTheme);
});

window.addEventListener('load', () => {
  const savedTheme = localStorage.getItem('theme') || 'classic';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeSelect.value = savedTheme;
});

/**************save book****************************/
function saveBooks() {
  localStorage.setItem('books', JSON.stringify(books));
}

/************filter list**************************/
const bookForm = document.getElementById('bookForm');
const bookDialog = document.getElementById('bookDialog');
const addBookBtn = document.querySelector('.btn-p');
const dialogTitle = document.getElementById('dialogTitle');

const detailsDialog = document.getElementById('detailsDialog');
const detailsImage = document.getElementById('detailsImage');
const detailsTitle = document.getElementById('detailsTitle');
const detailsAuthor = document.getElementById('detailsAuthor');
const detailsRating = document.getElementById('detailsRating');
const detailsStatus = document.getElementById('detailsStatus');
const detailsNotes = document.getElementById('detailsNotes');
const saveNotesBtn = document.getElementById('saveNotesBtn');

let books = JSON.parse(localStorage.getItem('books')) || [];
let editingId = null;

addBookBtn.addEventListener('click', () => {
  openBookDialog();
});

function openBookDialog(book = null) {
  bookDialog.showModal();
  if (book) {
    dialogTitle.textContent = "Edit Book";
    bookForm.bookTitle.value = book.title;
    bookForm.bookAuthor.value = book.author;
    bookForm.bookRating.value = book.rating;
    bookForm.bookStatus.value = book.status;
    editingId = book.id;
  } else {
    dialogTitle.textContent = "Add New book";
    bookForm.reset();
    editingId = null;
  }
}


function closeTaskDialog() {
  bookDialog.close();
  bookForm.reset();
  editingId = null;
}

bookForm.addEventListener('submit', e => {
  e.preventDefault();

  const title = bookForm.bookTitle.value.trim();
  const author = bookForm.bookAuthor.value.trim();
  const rating = bookForm.bookRating.value;
  const status = bookForm.bookStatus.value;

  const fileInput = document.getElementById('book-image');
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const image = event.target.result;
      saveBook({ title, author, rating, status, image });
    };
    reader.readAsDataURL(file);
  } else {
    let image = '';
    if (editingId) {
      const book = books.find(b => b.id === editingId);
      image = book ? book.image : '';
    }
    saveBook({ title, author, rating, status, image });
  }
});

function saveBook(bookData) {
  if (editingId) {
    books = books.map(b => b.id === editingId ? { ...b, ...bookData, id: editingId } : b);
  } else {
    const newBook = {
      ...bookData,
      id: Date.now(),
      isFavorite: false,
      notes: '' 
    };
    books.push(newBook);
  }

  localStorage.setItem('books', JSON.stringify(books));
  renderBooks();
  closeTaskDialog();
}

const confirmDeleteDialog = document.getElementById('confirmDeleteDialog');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

let bookIdToDelete = null;

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
    books = books.filter(book => book.id !== bookIdToDelete);
    localStorage.setItem('books', JSON.stringify(books));
    renderBooks();
    bookIdToDelete = null;
    confirmDeleteDialog.close();
  }
});

function editBook(id) {
  const book = books.find(b => b.id === id);
  if (book) openBookDialog(book);
}

// *** الوظيفة الجديدة لفتح ديتيل دياالوج لما تضغط على كارد ***
function openDetailsDialog(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  modalImage.src = book.image || 'https://via.placeholder.com/100x150?text=No+Image';
  modalTitle.textContent = book.title;
  modalAuthor.textContent = book.author;
  modalStatus.textContent = book.status;
  modalRating.textContent = '⭐'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
  bookNotes.value = book.notes || '';

  saveNotesBtn.dataset.bookId = bookId;
  bookModal.classList.remove('hidden');
}


// حفظ الملاحظات الجديدة
saveNotesBtn.addEventListener('click', () => {
  const bookId = parseInt(saveNotesBtn.dataset.bookId);
  const bookIndex = books.findIndex(b => b.id === bookId);
  if (bookIndex === -1) return;

  books[bookIndex].notes = bookNotes.value.trim();
  saveBooks();
  renderBooks();
  bookModal.classList.add('hidden');
});


// *** تعديل renderBooks لتضيف حدث فتح الديتيل دياالوج على الكارد ***
function renderBooks(overrideBooks = null) {
  bookContainer.innerHTML = '';
  let filteredBooks = overrideBooks || books;

  if (!overrideBooks) {
    if (currentFilter === 'Favorites') {
      filteredBooks = books.filter(book => book.isFavorite);
    } else if (currentFilter === 'Want to Read') {
      filteredBooks = books.filter(book => book.status.toLowerCase() === 'want to read');
    } else if (currentFilter === 'Finished') {
      filteredBooks = books.filter(book => book.status.toLowerCase() === 'finished');
    }
  }

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * booksPerPage;
  const end = start + booksPerPage;
  const paginatedBooks = filteredBooks.slice(start, end);

  if (paginatedBooks.length === 0) {
    bookContainer.innerHTML = '<p>no result</p>';
  } else {
    paginatedBooks.forEach(book => {
      const stars = '⭐'.repeat(book.rating) + '☆'.repeat(5 - book.rating);

      const card = document.createElement('div');
      card.classList.add('book-card');

      card.innerHTML = `
        <div class="img-box">
          <img src="${book.image || 'https://via.placeholder.com/100x150?text=No+Image'}" alt="Book Cover" class="book-cover">
        </div>
        <div class="card-content">
          <p><strong>${book.title}</strong></p>
          <p>${book.author}</p>
          <p>Rate: <span class="stars">${stars}</span></p>
          <p>Status: ${book.status}</p>
        </div>
        <div class="book-actions">
          <button onclick="toggleFavorite(${book.id})" class="favorite-btn">
            <i class="fas fa-heart ${book.isFavorite ? 'favorite-active' : ''}"></i>
          </button>
          <button onclick="editBook(${book.id})"><i class="fas fa-edit"></i></button>
          <button onclick="deleteBook(${book.id})"><i class="fas fa-trash-alt"></i></button>
          <button onclick="noteBook(${book.id})"><i class="fa fa-file-text" aria-hidden="true"></i></button>
        </div>
      `;
/******************************************************************* */
      // لما تضغط على الكارد (مش على الأزرار) يفتح التفاصيل
      card.addEventListener('click', (e) => {
        if (
          !e.target.closest('.favorite-btn') &&
          !e.target.closest('.fa-edit') &&
          !e.target.closest('.fa-trash-alt')
        ) {
          openDetailsDialog(book.id);
        }
      });

      bookContainer.appendChild(card);
    });
  }
closeModalBtn.addEventListener('click', () => {
  bookModal.classList.add('hidden');
});
/********************************************************************** */
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
  const completed = books.filter((b) => b.status.toLowerCase() === "finished").length;
  const total = books.length;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("totalCount").textContent = total;
}

function toggleFavorite(bookId) {
  const book = books.find(book => book.id === bookId);
  if (book) {
    book.isFavorite = !book.isFavorite;
    saveBooks();
    renderBooks();
    if (book.isFavorite) {
      alert(`تمت إضافة "${book.title}" إلى المفضلة ❤️`);
    } else {
      alert(`تمت إزالة "${book.title}" من المفضلة 💔`);
    }
  }
}

const filterList = document.getElementById('filterList');
let currentFilter = 'all';

filterList.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    document.querySelectorAll('#filterList li').forEach(li => li.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    currentPage = 1;
    renderBooks();
  }
});
/************************************************************************************** */
// دالة البحث
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  const result = books.filter(book =>
    book.title.toLowerCase().includes(query) ||
    book.author.toLowerCase().includes(query)
  );
  currentPage = 1;
  renderBooks(result);
});
//************************************burgerMenu******************************************* */
const burgerMenu = document.getElementById('burgerMenu');
const menuBar = document.querySelector('.menu-bar');
const menuOverlay = document.getElementById('menuOverlay');

burgerMenu.addEventListener('click', () => {
  menuBar.classList.toggle('show');
  menuOverlay.classList.toggle('hidden');
});

// إغلاق المينيو عند الضغط عالخلفية
menuOverlay.addEventListener('click', () => {
  menuBar.classList.remove('show');
  menuOverlay.classList.add('hidden');
});

// إغلاق المينيو بعد اختيار فلتر
document.querySelectorAll('.filter-list li').forEach(item => {
  item.addEventListener('click', () => {
    menuBar.classList.remove('show');
    menuOverlay.classList.add('hidden');
  });
});

/*******************theme selector*********************** */
const themeToggleBtn = document.getElementById('themeToggleBtn');


// فتح / إغلاق القائمة عند الضغط على الإيموجي
themeToggleBtn.addEventListener('click', () => {
  themeSelect.classList.toggle('hidden');
});

// تخفي القائمة لما تختارين شي منها
themeSelect.addEventListener('change', () => {
  themeSelect.classList.add('hidden');
});




window.toggleFavorite = toggleFavorite;
window.editBook = editBook;
window.deleteBook = deleteBook;

renderBooks();
