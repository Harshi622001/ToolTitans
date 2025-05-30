function escapeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    return String(str).replace(/[&<>"']/g, function (match) {
        return {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": "'"
        }[match];
    });
}

function addImageField(containerElement) { // Changed parameter from containerId to containerElement
    if (!containerElement) {
        console.error("addImageField: containerElement is null or undefined");
        return;
    }
    const div = document.createElement('div');
    div.className = 'dynamic-field-row';
    div.innerHTML = `
        <input type="text" placeholder="Image URL" class="image-url">
        <button type="button" class="remove-field-button" onclick="this.parentElement.remove()">-</button>
    `;
    // Insert before the "Add" button if it exists within the containerElement
    const addButton = containerElement.querySelector('.add-field-button');
    if (addButton) {
        containerElement.insertBefore(div, addButton);
    } else {
        containerElement.appendChild(div);
    }
}

function addDescriptionField(containerElement) { // Changed parameter from containerId to containerElement
    if (!containerElement) {
        console.error("addDescriptionField: containerElement is null or undefined");
        return;
    }
    const div = document.createElement('div');
    div.className = 'dynamic-field-row';
    div.innerHTML = `
        <input type="text" placeholder="Key" class="description-key">
        <input type="text" placeholder="Value" class="description-value">
        <button type="button" class="remove-field-button" onclick="this.parentElement.remove()">-</button>
    `;
    // Insert before the "Add" button if it exists within the containerElement
    const addButton = containerElement.querySelector('.add-field-button');
    if (addButton) {
        containerElement.insertBefore(div, addButton);
    } else {
        containerElement.appendChild(div);
    }
}

function collectImages(containerId) {
    const container = document.getElementById(containerId);
    const imageFields = container.querySelectorAll('.image-url');
    return Array.from(imageFields).map(field => field.value).filter(url => url);
}

function collectDescriptions(containerId) {
    const container = document.getElementById(containerId);
    const keys = container.querySelectorAll('.description-key');
    const values = container.querySelectorAll('.description-value');
    const descriptions = {};
    keys.forEach((key, index) => {
        if (key.value && values[index].value) {
            descriptions[key.value] = values[index].value;
        }
    });
    return descriptions;
}

function displayProducts() {
    fetch('http://localhost:8008/api/products/getAllProduct')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            return response.text(); // Get response as text first
        })
        .then(textData => {
            let data;
            try {
                data = JSON.parse(textData);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                console.error('Raw server response:', textData); // Log the raw response
                throw new Error('Failed to parse product data from server. Raw response logged to console.');
            }
            const productList = document.getElementById('product-list');
            productList.innerHTML = '';
            console.log(data);
            // Sort data to show newest products first (assuming newer products have higher IDs)
            data.sort((a, b) => b.id - a.id);
            data.forEach(product => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';

                const descriptionHTML = Object.entries(product.description || {})
                    .map(([key, value]) => `<p><strong>${escapeHTML(key)}:</strong> ${escapeHTML(value)}</p>`)
                    .join('');

                let imageHTML = '<div class="no-image-placeholder"><p>No image available</p></div>';
                // Display only the first image for the card, if available
                if (product.image && product.image.length > 0 && product.image[0]) {
                    imageHTML = `<img src="${escapeHTML(product.image[0])}" alt="${escapeHTML(product.name)}">`;
                }

                let totalStock = 0;
                let stockDisplay = 'N/A';
                if (product.productDetails && product.productDetails.length > 0) {
                    totalStock = product.productDetails.reduce((sum, detail) => sum + (detail.stock || 0), 0);
                    stockDisplay = totalStock > 0 ? `${totalStock} available` : 'Out of Stock';
                } else {
                    stockDisplay = 'No variants / Out of Stock';
                }
                
                productItem.innerHTML = `
                    <div class="product-images">
                        ${imageHTML}
                    </div>
                    <div class="product-content">
                        <h3>${escapeHTML(product.name)}</h3>
                        <div class="product-info">
                            <p><strong>Summary:</strong> ${escapeHTML(product.productSummary) || 'N/A'}</p>
                            <p><strong>Brand:</strong> ${escapeHTML(product.brand) || 'N/A'}</p>
                            <p><strong>Units:</strong> ${product.noOfUnitsInBox || 'N/A'}</p>
                            <p><strong>Category ID:</strong> ${product.categoryId || 'N/A'}</p>
                            <p><strong>Stock:</strong> ${stockDisplay}</p>
                        </div>
                        ${(product.description && Object.keys(product.description).length > 0) ?
                        `<div class="product-description">
                            <h4>Attributes:</h4>
                            ${descriptionHTML}
                        </div>` : '<div class="product-description"><p>No attributes available</p></div>'}
                    </div>
                    <div class="product-actions">
                        <button onclick="openEditModal(${product.id})" title="Edit Product">Edit</button>
                        <button onclick="openVariantModal(${product.id})" title="Manage Variants">Manage</button>
                        <button onclick="deleteProduct(${product.id})" class="delete-button" title="Delete Product">Delete</button>
                    </div>
                `;
                productList.appendChild(productItem);
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            alert('Failed to load products. Please try again.');
        });
}

function openAddModal() {
    // Ensure other main modals are closed
    closeModal('editModal');
    closeModal('variantModal');
    closeModal('addVariantModal'); // Also close sub-variant modals just in case
    closeModal('editVariantModal');

    document.getElementById('addForm').reset();
    // Assuming a similar function exists or you want to clear descriptions for new products
    // If 'newProductDescriptions' is the ID for the description container in addModal:
    clearDynamicDescriptionFields('newProductDescriptions');
    document.getElementById('addModal').style.display = 'block';
}

function openEditModal(productId) {
    fetch(`http://localhost:8008/api/products/getProductById/${productId}`) // Fetch specific product
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch product details for editing');
            }
            return response.json();
        })
        .then(product => { // product is now the single product object
            if (product) {
                productBeingEdited = product; // Store the full product object
                document.getElementById('editProductId').value = product.id;
                document.getElementById('editProductName').value = product.name;
                document.getElementById('editProductSummary').value = product.productSummary || '';

                const imagesContainer = document.getElementById('editProductImages');
                // Clear only dynamic rows, not the whole container if "Add" button is static inside
                imagesContainer.querySelectorAll('.dynamic-field-row').forEach(row => row.remove());
                product.image.forEach(img => {
                    const div = document.createElement('div');
                    div.className = 'dynamic-field-row';
                    div.innerHTML = `
                        <input type="text" value="${escapeHTML(img)}" class="image-url">
                        <button type="button" class="remove-field-button" onclick="this.parentElement.remove()">-</button>
                    `;
                    const addButton = imagesContainer.querySelector('.add-field-button');
                    if (addButton) {
                        imagesContainer.insertBefore(div, addButton);
                    } else {
                        imagesContainer.appendChild(div);
                    }
                });

                const descriptionsContainer = document.getElementById('editProductDescriptions');
                descriptionsContainer.querySelectorAll('.dynamic-field-row').forEach(row => row.remove());
                Object.entries(product.description || {}).forEach(([key, value]) => {
                    const div = document.createElement('div');
                    div.className = 'dynamic-field-row';
                    div.innerHTML = `
                        <input type="text" value="${escapeHTML(key)}" class="description-key">
                        <input type="text" value="${escapeHTML(value)}" class="description-value">
                        <button type="button" class="remove-field-button" onclick="this.parentElement.remove()">-</button>
                    `;
                    const addButton = descriptionsContainer.querySelector('.add-field-button');
                     if (addButton) {
                        descriptionsContainer.insertBefore(div, addButton);
                    } else {
                        descriptionsContainer.appendChild(div);
                    }
                });
                 // If no descriptions, and it's an edit form, we might not want to add an empty row automatically
                // unless the HTML structure expects one for the "Add" button to be positioned correctly.
                // Given the HTML for editProductDescriptions has the button, this is fine.

                // document.getElementById('editProductPrice').value = product.price; // Price removed
                document.getElementById('editProductUnits').value = product.noOfUnitsInBox || '';
                document.getElementById('editProductBrand').value = product.brand || '';
                document.getElementById('editProductSubcategory').value = product.categoryId || ''; // This ID is for categoryId input

                // Ensure other main modals are closed before opening this one
                closeModal('addModal');
                closeModal('variantModal');
                closeModal('addVariantModal');
                closeModal('editVariantModal');

                document.getElementById('editModal').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching product details:', error);
            alert('Failed to load product details. Please try again.');
        });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // If it's a dynamically created modal that should be removed on close:
        if (modal.classList.contains('dynamic-modal')) {
            modal.remove();
        }
    }
}

// Helper function to create basic modal structure
function createModalStructure(modalId, titleText, onclose = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }

    const modalDiv = document.createElement('div');
    modalDiv.id = modalId;
    modalDiv.className = 'modal dynamic-modal'; // Add 'dynamic-modal' class

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = onclose ? onclose : () => closeModal(modalId);

    const title = document.createElement('h2');
    title.textContent = titleText;

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalDiv.appendChild(modalContent);
    document.body.appendChild(modalDiv);

    return { modalDiv, modalContent }; // Return parts for further content addition
}


function saveNewProduct(event) {
    event.preventDefault();
    const categoryIdValue = parseInt(document.getElementById('newProductSubcategory').value);
    const newProduct = {
        name: document.getElementById('newProductName').value,
        productSummary: document.getElementById('newProductSummary').value,
        image: collectImages('newProductImages'),
        noOfUnitsInBox: parseInt(document.getElementById('newProductUnits').value) || 0,
        brand: document.getElementById('newProductBrand').value,
        description: collectDescriptions('newProductDescriptions'),
        categoryId: categoryIdValue,
        productDetails: [] // Add an empty array for productDetails
    };

    // The categoryId in the URL for createProduct might be redundant if also in body,
    // but matching existing backend controller signature.
    // Ensure your backend ProductService.createProduct uses the categoryId from ProductEntity if the RequestParam is not primary.
    fetch(`http://localhost:8008/api/products/createProduct?categoryId=${categoryIdValue}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
        },
        body: JSON.stringify(newProduct)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create product');
            }
            return response.json();
        })
        .then(data => {
            console.log('Product created successfully:', data);
            displayProducts();
            closeModal('addModal');
        })
        .catch(error => {
            console.error('Error creating product:', error);
            alert('Failed to create product. Please try again.');
        });
}

function saveEditedProduct(event) {
    event.preventDefault();

    const productId = parseInt(document.getElementById('editProductId').value);
    if (!productBeingEdited || productBeingEdited.id !== productId) {
        console.error("Product data for editing is missing or mismatched.");
        alert("Error: Could not save product. Please try reopening the edit form.");
        return;
    }

    const updatedProduct = {
        id: productId,
        name: document.getElementById('editProductName').value,
        productSummary: document.getElementById('editProductSummary').value,
        image: collectImages('editProductImages'),
        noOfUnitsInBox: parseInt(document.getElementById('editProductUnits').value) || 0,
        brand: document.getElementById('editProductBrand').value,
        description: collectDescriptions('editProductDescriptions'),
        categoryId: parseInt(document.getElementById('editProductSubcategory').value),
        productDetails: productBeingEdited.productDetails || [] // Preserve existing variants
    };

    fetch(`http://localhost:8008/api/products/updateProduct/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
        },
        body: JSON.stringify(updatedProduct)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update product');
            }
            return response.json();
        })
        .then(data => {
            console.log('Product updated successfully:', data);
            displayProducts();
            closeModal('editModal');
            productBeingEdited = null; // Clear the stored product
        })
        .catch(error => {
            console.error('Error updating product:', error);
            alert('Failed to update product. Please try again.');
        });
}

function deleteProduct(productId) {
    fetch(`http://localhost:8008/api/products/deleteProduct/${productId}`, {
        method: 'DELETE',
        headers: {
            'accept': '*/*'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete product');
            }
            return response.text();
        })
        .then(message => {
            console.log(message);
            alert(message);
            displayProducts();
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            alert('Failed to delete product. Please try again.');
        });
    }
    
    // --- Variant Management Functions ---
    
    let currentProductForVariantManagement = null;
    let productBeingEdited = null; // Variable to store product being edited

    function openVariantModal(productId) {
        fetch(`http://localhost:8008/api/products/getProductById/${productId}`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch product details. Status: ${response.status}`);
                return response.json();
            })
            .then(product => {
                currentProductForVariantManagement = product;

                // Close other main modals
                ['addModal', 'editModal', 'addVariantModal', 'editVariantModal'].forEach(id => {
                    const m = document.getElementById(id);
                    if (m) closeModal(id);
                });
                
                const { modalDiv, modalContent } = createModalStructure('variantModal', `Manage Variants for ${escapeHTML(product.name)}`);

                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = 'variantModalProductId';
                hiddenInput.value = product.id;
                modalContent.appendChild(hiddenInput);

                const variantsList = document.createElement('div');
                variantsList.id = 'existingVariantsList';
                modalContent.appendChild(variantsList);
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'form-actions'; // Use existing class for styling

                const addButton = document.createElement('button');
                addButton.textContent = 'Add New Variant';
                addButton.className = 'form-button'; // General form button class
                addButton.onclick = openAddVariantModal;
                actionsDiv.appendChild(addButton);
                modalContent.appendChild(actionsDiv);

                modalDiv.style.display = 'block';
                displayProductVariants(product.productDetails || []);
            })
            .catch(error => {
                console.error('Error in openVariantModal:', error);
                alert('Could not load product variants: ' + error.message);
            });
    }

    function displayProductVariants(variants) {
        const variantsListDiv = document.getElementById('existingVariantsList');
        if (!variantsListDiv) {
            console.error('Variants list container not found');
            return;
        }
        
        // Clear and set header
        variantsListDiv.innerHTML = '';
        const header = document.createElement('h4');
        header.textContent = 'Existing Variants';
        header.style.marginTop = '0';
        header.style.marginBottom = '15px';
        variantsListDiv.appendChild(header);
        if (!variants || variants.length === 0) {
            variantsListDiv.innerHTML += '<p>No variants added yet.</p>';
            return;
        }
    
        const ul = document.createElement('ul');
        variants.forEach(variant => {
            const li = document.createElement('li');
            li.className = 'variant-list-item';
            let variantImageHTML = '<div class="variant-thumbnail no-image-placeholder"><span>No Image</span></div>';
            if (variant.variantImage && variant.variantImage.variantImageUrl) {
                variantImageHTML = `<img src="${escapeHTML(variant.variantImage.variantImageUrl)}" alt="${escapeHTML(variant.variant) || 'Variant'}" class="variant-thumbnail">`;
            }

            let descriptionHTML = '<p>No specific attributes.</p>';
            if (variant.description && Object.keys(variant.description).length > 0) {
                descriptionHTML = Object.entries(variant.description)
                    .map(([key, value]) => `<p><strong>${escapeHTML(key)}:</strong> ${escapeHTML(value)}</p>`)
                    .join('');
            }

            li.innerHTML = `
                <div class="variant-image-container">
                    ${variantImageHTML}
                </div>
                <div class="variant-details">
                    <h4>${escapeHTML(variant.variant) || 'N/A'}</h4>
                    <p><strong>Price:</strong> ${variant.price !== undefined ? `Rs. ${variant.price}` : 'N/A'}</p>
                    <p><strong>Stock:</strong> ${variant.stock !== undefined ? variant.stock : 'N/A'}</p>
                    <p><strong>Discount:</strong> ${variant.discount !== undefined ? `${variant.discount}%` : 'N/A'}</p>
                </div>
                <div class="variant-attributes">${descriptionHTML}</div>
                <div class="variant-actions">
                    <button onclick="openEditVariantModal(${variant.id})" class="form-button">Edit</button>
                    <button onclick="deleteVariant(${variant.id})" class="form-button delete-button">Delete</button>
                </div>
            `;
            ul.appendChild(li);
        });
        variantsListDiv.appendChild(ul);
    }

    function clearDynamicDescriptionFields(containerId) {
        const descriptionsContainer = document.getElementById(containerId);
        if (!descriptionsContainer) return;

        const dynamicRows = descriptionsContainer.querySelectorAll('.dynamic-field-row');
        
        // Remove all existing dynamic rows
        dynamicRows.forEach(row => row.remove());

        // For 'newProductDescriptions' (static HTML modal) and 'newVariantDescriptionsContainer' (dynamic variant modal),
        // ensure one fresh, empty row is present.
        if (containerId === 'newProductDescriptions' || containerId === 'newVariantDescriptionsContainer') {
            const div = document.createElement('div');
            div.className = 'dynamic-field-row';
            div.innerHTML = `
                <input type="text" placeholder="Key" class="description-key">
                <input type="text" placeholder="Value" class="description-value">
                <button type="button" class="remove-field-button" onclick="this.parentElement.remove()">-</button>
            `;
            const addButton = descriptionsContainer.querySelector('.add-field-button');
            if (addButton) {
                descriptionsContainer.insertBefore(div, addButton);
            } else {
                // Fallback for newVariantDescriptionsContainer which might not have the button yet when this is first called
                descriptionsContainer.appendChild(div);
            }
        }
        // For 'editProductDescriptions', it's populated by openEditModal. If it's empty after data load,
        // and user wants to add, they use the "Add" button. No default empty row needed here from clear*.
    }
    
    
    function openAddVariantModal() {
        if (!currentProductForVariantManagement) {
            alert('Please select a product first.');
            return;
        }
        const { modalDiv, modalContent } = createModalStructure('addVariantModal', `Add New Variant for ${escapeHTML(currentProductForVariantManagement.name)}`);

        const form = document.createElement('form');
        form.id = 'addVariantForm';
        form.onsubmit = saveNewVariant;

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'addVariantProductId';
        hiddenInput.value = currentProductForVariantManagement.id;
        form.appendChild(hiddenInput);

        // Helper to create form fields
        const createFormField = (labelText, inputId, inputType, placeholder, required, step = null) => {
            const div = document.createElement('div');
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.textContent = labelText;
            const input = document.createElement('input');
            input.type = inputType;
            input.id = inputId;
            input.placeholder = placeholder;
            input.required = required;
            if (step) input.step = step;
            div.appendChild(label);
            div.appendChild(input);
            return div;
        };

        form.appendChild(createFormField('Variant Name:', 'newVariantName', 'text', 'e.g., Red, Large', true));
        form.appendChild(createFormField('Price:', 'newVariantPrice', 'number', 'Enter price', true, '0.01'));
        form.appendChild(createFormField('Stock:', 'newVariantStock', 'number', 'Enter stock quantity', true));
        form.appendChild(createFormField('Discount (%):', 'newVariantDiscount', 'number', 'Enter discount (0-100)', false, '0.01')); // Min 0, Max 100 validation can be added
        form.appendChild(createFormField('Image URL:', 'newVariantImageUrl', 'text', 'Enter image URL', false));
        
        // Descriptions
        const descGroup = document.createElement('div');
        descGroup.className = 'dynamic-field-group';
        descGroup.id = 'newVariantDescriptionsContainer';
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Variant Specific Descriptions:';
        descGroup.appendChild(descLabel);
        // Call addDescriptionField with the element itself
        addDescriptionField(descGroup);
        
        const addDescBtn = document.createElement('button');
        addDescBtn.type = 'button';
        addDescBtn.textContent = 'Add Another Description';
        addDescBtn.className = 'add-field-button';
        // Pass the descGroup element to the onclick handler
        addDescBtn.onclick = () => addDescriptionField(descGroup);
        descGroup.appendChild(addDescBtn);
        form.appendChild(descGroup);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'form-actions';
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = 'Save New Variant';
        submitBtn.className = 'form-button';
        actionsDiv.appendChild(submitBtn);
        form.appendChild(actionsDiv);

        modalContent.appendChild(form);
        modalDiv.style.display = 'block';
    }

    function openEditVariantModal(productDetailId) {
        if (!currentProductForVariantManagement) {
            alert('Product context not found. Please reopen the "Manage Variants" view.');
            return;
        }
        const variantToEdit = (currentProductForVariantManagement.productDetails || []).find(v => v.id === productDetailId);
        if (!variantToEdit) {
            alert('Variant not found.');
            return;
        }
        const { modalDiv, modalContent } = createModalStructure('editVariantModal', `Edit Variant for ${escapeHTML(currentProductForVariantManagement.name)}`);

        const form = document.createElement('form');
        form.id = 'editVariantForm';
        form.onsubmit = saveEditedVariant;

        const createHiddenInput = (id, value) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.id = id;
            input.value = value;
            return input;
        };
        form.appendChild(createHiddenInput('editVariantProductId', currentProductForVariantManagement.id));
        form.appendChild(createHiddenInput('editProductDetailId', variantToEdit.id));

        const createFormFieldWithValue = (labelText, inputId, inputType, placeholder, required, value, step = null) => {
            const div = document.createElement('div');
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.textContent = labelText;
            const input = document.createElement('input');
            input.type = inputType;
            input.id = inputId;
            input.placeholder = placeholder;
            input.required = required;
            input.value = value;
            if (step) input.step = step;
            div.appendChild(label);
            div.appendChild(input);
            return div;
        };

        form.appendChild(createFormFieldWithValue('Variant Name:', 'editVariantName', 'text', 'e.g., Red, Large', true, variantToEdit.variant || ''));
        form.appendChild(createFormFieldWithValue('Price:', 'editVariantPrice', 'number', 'Enter price', true, variantToEdit.price !== undefined ? variantToEdit.price : '', '0.01'));
        form.appendChild(createFormFieldWithValue('Stock:', 'editVariantStock', 'number', 'Enter stock quantity', true, variantToEdit.stock !== undefined ? variantToEdit.stock : ''));
        form.appendChild(createFormFieldWithValue('Discount (%):', 'editVariantDiscount', 'number', 'Enter discount (0-100)', false, variantToEdit.discount !== undefined ? variantToEdit.discount : '', '0.01'));
        form.appendChild(createFormFieldWithValue('Image URL:', 'editVariantImageUrl', 'text', 'Enter image URL', false, (variantToEdit.variantImage && variantToEdit.variantImage.variantImageUrl) || ''));

        // Descriptions
        const descGroup = document.createElement('div');
        descGroup.className = 'dynamic-field-group';
        descGroup.id = 'editVariantDescriptionsContainer';
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Variant Specific Descriptions:';
        descGroup.appendChild(descLabel);

        if (variantToEdit.description && Object.keys(variantToEdit.description).length > 0) {
            Object.entries(variantToEdit.description).forEach(([key, value]) => {
                const descRow = document.createElement('div');
                descRow.className = 'dynamic-field-row';
                descRow.innerHTML = `
                    <input type="text" placeholder="Key" class="description-key" value="${escapeHTML(key)}">
                    <input type="text" placeholder="Value" class="description-value" value="${escapeHTML(value)}">
                    <button type="button" class="remove-field-button" onclick="this.parentElement.remove()">-</button>
                `;
                descGroup.appendChild(descRow);
            });
        } else {
             // If no descriptions, add one initial field. Pass the element.
             addDescriptionField(descGroup);
        }
        
        const addDescBtn = document.createElement('button');
        addDescBtn.type = 'button';
        addDescBtn.textContent = 'Add Another Description';
        addDescBtn.className = 'add-field-button';
        // Pass the descGroup element to the onclick handler
        addDescBtn.onclick = () => addDescriptionField(descGroup);
        descGroup.appendChild(addDescBtn);
        form.appendChild(descGroup);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'form-actions';
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = 'Save Changes';
        submitBtn.className = 'form-button';
        actionsDiv.appendChild(submitBtn);
        form.appendChild(actionsDiv);

        modalContent.appendChild(form);
        modalDiv.style.display = 'block';
    }

    function saveNewVariant(event) {
        event.preventDefault();
        if (!currentProductForVariantManagement) {
            alert('No product selected. Cannot save new variant.');
            return;
        }
        const productId = document.getElementById('addVariantProductId').value;
        if (currentProductForVariantManagement.id !== parseInt(productId)) {
            alert('Product ID mismatch. Please try again.');
            return;
        }
    
        const newVariantData = {
            // id will be assigned by backend
            variant: document.getElementById('newVariantName').value,
            price: parseFloat(document.getElementById('newVariantPrice').value),
            stock: parseInt(document.getElementById('newVariantStock').value),
            discount: parseFloat(document.getElementById('newVariantDiscount').value) || 0, // Default to 0 if not provided or invalid
            description: collectDescriptions('newVariantDescriptionsContainer'),
        };
        const newVariantDiscountInput = document.getElementById('newVariantDiscount');
        if (newVariantDiscountInput) {
            const discountValue = parseFloat(newVariantDiscountInput.value);
            if (!isNaN(discountValue) && discountValue >= 0 && discountValue <= 100) {
                newVariantData.discount = discountValue;
            } else {
                // alert('Discount must be between 0 and 100.'); // Optional: alert user
                newVariantData.discount = 0; // Default or handle error
            }
        }

        const imageUrl = document.getElementById('newVariantImageUrl').value;
        if (imageUrl && imageUrl.trim() !== '') {
            newVariantData.variantImage = { variantImageUrl: imageUrl.trim() };
        } else {
            newVariantData.variantImage = null; // Explicitly set to null if no image URL
        }

        currentProductForVariantManagement.productDetails = currentProductForVariantManagement.productDetails || [];
        currentProductForVariantManagement.productDetails.push(newVariantData);

        updateProductWithVariants(currentProductForVariantManagement, 'addVariantModal');
    }

    function saveEditedVariant(event) {
        event.preventDefault();
        if (!currentProductForVariantManagement) {
            alert('No product selected. Cannot save edited variant.');
            return;
        }
        const productId = document.getElementById('editVariantProductId').value;
        const productDetailId = parseInt(document.getElementById('editProductDetailId').value);
    
        if (currentProductForVariantManagement.id !== parseInt(productId)) {
            alert('Product ID mismatch. Please try again.');
            return;
        }
    
        const editedVariantData = {
            id: productDetailId,
            variant: document.getElementById('editVariantName').value,
            price: parseFloat(document.getElementById('editVariantPrice').value),
            stock: parseInt(document.getElementById('editVariantStock').value),
            discount: parseFloat(document.getElementById('editVariantDiscount').value) || 0, // Default to 0
            description: collectDescriptions('editVariantDescriptionsContainer'),
        };

        const editVariantDiscountInput = document.getElementById('editVariantDiscount');
        if (editVariantDiscountInput) {
            const discountValue = parseFloat(editVariantDiscountInput.value);
            if (!isNaN(discountValue) && discountValue >= 0 && discountValue <= 100) {
                editedVariantData.discount = discountValue;
            } else {
                // alert('Discount must be between 0 and 100.'); // Optional: alert user
                editedVariantData.discount = variantToEdit.discount || 0; // Revert to original or default
            }
        }

        const imageUrl = document.getElementById('editVariantImageUrl').value;
        if (imageUrl) {
            // Check if existing image data needs to be preserved (like productVariantId)
            const existingVariant = currentProductForVariantManagement.productDetails.find(vd => vd.id === productDetailId);
            editedVariantData.variantImage = {
                variantImageUrl: imageUrl,
                productVariantId: (existingVariant && existingVariant.variantImage) ? existingVariant.variantImage.productVariantId : null
            };
        } else {
            editedVariantData.variantImage = null; // Explicitly set to null if URL is empty
        }
        
        currentProductForVariantManagement.productDetails = (currentProductForVariantManagement.productDetails || []).map(v =>
            v.id === productDetailId ? { ...v, ...editedVariantData } : v
        );
        
        updateProductWithVariants(currentProductForVariantManagement, 'editVariantModal');
    }
    
    function deleteVariant(productDetailId) {
        if (!currentProductForVariantManagement) {
            alert('Product context error for deleting variant.');
            return;
        }
        if (!confirm('Are you sure you want to delete this variant?')) return;
    
        currentProductForVariantManagement.productDetails = (currentProductForVariantManagement.productDetails || []).filter(v => v.id !== productDetailId);
        updateProductWithVariants(currentProductForVariantManagement); // No specific modal to close here, variant list will refresh
    }
    
    
    function updateProductWithVariants(productEntity, modalToCloseId = null) {
        fetch(`http://localhost:8008/api/products/updateProduct/${productEntity.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify(productEntity)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error('Failed to update product with variants: ' + text + (response.statusText ? ` (${response.statusText})` : '')); });
            }
            return response.json();
        })
        .then(updatedProduct => {
            console.log('Product with variants updated successfully:', updatedProduct);
            currentProductForVariantManagement = updatedProduct; // Update local copy with server response
            
            if (modalToCloseId) {
                closeModal(modalToCloseId);
            }
            // Refresh the list in the main variant modal if it's open or re-open it
            // For simplicity, we assume if currentProductForVariantManagement is set, variantModal might be relevant
            if (document.getElementById('variantModal').style.display === 'block' || modalToCloseId) {
                 displayProductVariants(updatedProduct.productDetails || []);
            }
           
            displayProducts(); // Refresh main product list on page
            // alert('Product variants updated successfully!'); // Optional success message
        })
        .catch(error => {
            console.error('Error updating product with variants:', error);
            alert('Failed to update product variants. ' + error.message);
            // To ensure consistency, you might want to re-fetch the product if an update fails
            // For now, just log and alert. If variantModal was open, it remains with stale data until re-opened.
            if (currentProductForVariantManagement) { // If we have a product context, try to refresh its variant view
                openVariantModal(currentProductForVariantManagement.id);
            }
        });
    }
    
    window.onload = displayProducts;