// function displayCategories() {
//     fetch('http://localhost:8008/api/categories')
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to fetch categories');
//             }
//             return response.json();
//         })
//         .then(data => {
//             const categoryList = document.getElementById('category-list');
//             categoryList.innerHTML = '';
//             // Add header row
//             const headerRow = document.createElement('div');
//             headerRow.className = 'category-header';
//             headerRow.innerHTML = `
//                 <div><strong>ID</strong></div>
//                 <div><strong>Name</strong></div>
//                 <div><strong>Image</strong></div>
//             `;
//             headerRow.style.display = 'flex';
//             headerRow.style.justifyContent = 'space-between';
//             headerRow.style.marginBottom = '10px';
//             categoryList.appendChild(headerRow);

//             data.forEach(category => {
//                 const categoryItem = document.createElement('div');
//                 categoryItem.className = 'category-item';
//                 categoryItem.innerHTML = `
//                     <span>${category.id}</span><br>
//                     <span>${category.name}</span>
//                     <img src="${category.image}" alt="Category Image">
//                     <div class="category-actions">
//                         <button onclick="openEditModal(${category.id})">Edit</button>
//                         <button onclick="deleteCategory(${category.id})">Delete</button>
//                     </div>
//                 `;
//                 categoryList.appendChild(categoryItem);
//             });
//         })
//         .catch(error => {
//             console.error('Error fetching categories:', error);
//             alert('Failed to load categories. Please try again.');
//         });
// }
function displayCategories() {
    fetch('http://localhost:8008/api/categories')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            return response.json();
        })
        .then(data => {
            const categoryList = document.getElementById('category-list');
            categoryList.innerHTML = ''; // Clear existing content

            data.forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'category-item';
                categoryItem.innerHTML = `
                    <p>${category.id}</p>
                    <img src="${category.image}" alt="Category Image">
                    <h3>${category.name}</h3>
                    
                    <div class="category-actions">
                        <button onclick="openEditModal(${category.id})">Edit</button>
                        <button onclick="deleteCategory(${category.id})">Delete</button>
                    </div>
                `;
                categoryList.appendChild(categoryItem);
            });
        })
        .catch(error => {
            console.error('Error fetching categories:', error);
            alert('Failed to load categories. Please try again.');
        });
}

function openAddModal() {
    document.getElementById('addModal').style.display = 'block';
}

function openEditModal(categoryId) {
    fetch(`http://localhost:8008/api/categories`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch category details');
            }
            return response.json();
        })
        .then(data => {
            const category = data.find(c => c.id === categoryId);
            if (category) {
                document.getElementById('editCategoryId').value = category.id;
                document.getElementById('editCategoryName').value = category.name;
                document.getElementById('editCategoryImage').value = category.image;
                document.getElementById('editModal').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching category details:', error);
            alert('Failed to load category details. Please try again.');
        });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function saveNewCategory(event) {
    event.preventDefault();
    const newCategory = {
        name: document.getElementById('newCategoryName').value,
        image: document.getElementById('newCategoryImage').value
    };

    fetch('http://localhost:8008/api/categories/createCategory', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
        },
        body: JSON.stringify(newCategory)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create category');
            }
            return response.json();
        })
        .then(data => {
            console.log('Category created successfully:', data);
            displayCategories();
            closeModal('addModal');
        })
        .catch(error => {
            console.error('Error creating category:', error);
            alert('Failed to create category. Please try again.');
        });
}

function saveEditedCategory(event) {
    event.preventDefault();
    const updatedCategory = {
        id: parseInt(document.getElementById('editCategoryId').value),
        name: document.getElementById('editCategoryName').value,
        image: document.getElementById('editCategoryImage').value
    };

    fetch(`http://localhost:8008/api/categories/update/${updatedCategory.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
        },
        body: JSON.stringify(updatedCategory)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update category');
            }
            return response.json();
        })
        .then(data => {
            console.log('Category updated successfully:', data);
            displayCategories();
            closeModal('editModal');
        })
        .catch(error => {
            console.error('Error updating category:', error);
            alert('Failed to update category. Please try again.');
        });
}

function deleteCategory(categoryId) {
    fetch(`http://localhost:8008/api/categories/delete/${categoryId}`, {
        method: 'DELETE',
        headers: {
            'accept': '*/*'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete category');
            }
            return response.text();
        })
        .then(message => {
            console.log(message);
            alert(message);
            displayCategories();
        })
        .catch(error => {
            console.error('Error deleting category:', error);
            alert('Failed to delete category. Please try again.');
        });
}

window.onload = displayCategories;