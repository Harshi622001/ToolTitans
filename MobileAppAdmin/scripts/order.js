function displayOrders() {
    fetch('http://localhost:8008/orders/admin/all')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            return response.json();
        })
        .then(data => {
            const orderList = document.getElementById('order-list');
            if (!orderList) {
                console.error('Error: Element with ID "order-list" not found.');
                return;
            }
            orderList.innerHTML = ''; // Clear existing content

            if (!Array.isArray(data) || data.length === 0) {
                orderList.innerHTML = '<p>No orders found or invalid data format.</p>';
                console.warn('No orders found or invalid data received:', data);
                return;
            }

            // Sort data by orderDate in descending order (latest first)
            data.sort((a, b) => {
                const dateA = new Date(a.orderDate);
                const dateB = new Date(b.orderDate);
                return dateB - dateA;
            });

            // Create table structure
            const table = document.createElement('table');
            table.className = 'order-table';

            // Create table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const headers = ['ID', 'Order Items', 'Address', 'Delivery Date', 'Contact No.', 'Email', 'Order Date', 'Payment Method', 'UPI ID', 'Status', 'Total Price', 'Actions'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create table body
            const tbody = document.createElement('tbody');
            data.forEach(order => {
                const row = document.createElement('tr');
                row.dataset.orderId = order.id;

                const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '';
                const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A';

                // Format order items
                let orderItemsText = 'N/A';
                if (Array.isArray(order.items) && order.items.length > 0) {
                    const itemsList = order.items.map(item => {
                        const priceDisplay = item.price !== null && item.price !== undefined ? item.price.toFixed(2) : 'N/A';
                        return `Item_ID: ${item.productId || 'N/A'}<br>Item_Name: ${item.variant || 'Unknown Item'}<br>Item_Quantity: ${item.quantity || 'N/A'}<br>Item_Price: ${priceDisplay}`;
                    }).join('<br><br>');
                    orderItemsText = itemsList;
                }

                // Get Payment Method content
                let paymentMethodContent = order.paymentMethod || 'N/A';

                // Determine UPI ID content for the new column
                let upiIdContent = 'N/A'; // Declare and initialize
                if (order.paymentMethod && order.paymentMethod.toUpperCase() === 'UPI' && order.upiId) {
                    upiIdContent = order.upiId; // Assign if applicable
                }

                // Prepare display values
                const deliveryDateDisplay = deliveryDate ? new Date(deliveryDate).toLocaleDateString() : 'N/A';
                const totalPriceDisplay = order.totalPrice !== null && order.totalPrice !== undefined ? order.totalPrice.toFixed(2) : 'N/A';

                // Display raw data values in cells
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${orderItemsText}</td>
                    <td>${order.address || 'N/A'}</td>
                    <td class="delivery-date-cell">${deliveryDateDisplay}</td>
                    <td>${order.mobileNumber || 'N/A'}</td>
                    <td>${order.email || 'N/A'}</td>
                    <td>${orderDate}</td>
                    <td>${paymentMethodContent}</td>
                    <td>${upiIdContent}</td>
                    <td class="status-cell">${order.status || 'N/A'}</td>
                    <td>${totalPriceDisplay}</td>
                    <td class="actions-cell">
                        <button class="edit-btn">Edit</button>
                    </td>
                `;
                // Store the raw date for the input field
                row.dataset.deliveryDateRaw = deliveryDate;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            orderList.appendChild(table);
            addEditEventListeners(); // Add listeners after table is in DOM
        })
        .catch(error => {
            // Log any error in the promise chain
            console.error('Error in displayOrders promise chain:', error);
            const orderList = document.getElementById('order-list');
            if (orderList) {
                orderList.innerHTML = '<p>Failed to load orders. Please check the console and ensure the API is running.</p>';
            }
        });
}

function addEditEventListeners() {
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', handleEditClick);
    });
}

function handleEditClick(event) {
    const row = event.target.closest('tr');
    const statusCell = row.querySelector('.status-cell');
    const deliveryDateCell = row.querySelector('.delivery-date-cell');
    const actionsCell = row.querySelector('.actions-cell');
    const currentStatus = statusCell.textContent;
    const currentDeliveryDate = row.dataset.deliveryDateRaw || ''; // Get raw date
    const orderId = row.dataset.orderId;

    // Store original content in case of cancel
    row.dataset.originalStatus = currentStatus;
    row.dataset.originalDeliveryDate = currentDeliveryDate;
    row.dataset.originalDeliveryDateDisplay = deliveryDateCell.textContent; // Store display version

    // Replace status text with a dropdown
    statusCell.innerHTML = `
        <select class="status-select">
            <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${currentStatus === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${currentStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
    `;

    // Replace delivery date text with a date input
    deliveryDateCell.innerHTML = `<input type="date" class="delivery-date-input" value="${currentDeliveryDate}">`;

    // Replace Edit button with Save and Cancel buttons
    actionsCell.innerHTML = `
        <button class="save-btn">Save</button>
        <button class="cancel-btn">Cancel</button>
    `;

    // Add event listeners for new buttons
    actionsCell.querySelector('.save-btn').addEventListener('click', () => handleSaveClick(orderId, row));
    actionsCell.querySelector('.cancel-btn').addEventListener('click', () => handleCancelClick(row));
}

function handleSaveClick(orderId, row) {
    const statusSelect = row.querySelector('.status-select');
    const deliveryDateInput = row.querySelector('.delivery-date-input');
    const newStatus = statusSelect.value;
    const newDeliveryDate = deliveryDateInput.value; // Get value from date input
    const statusCell = row.querySelector('.status-cell');
    const deliveryDateCell = row.querySelector('.delivery-date-cell');
    const actionsCell = row.querySelector('.actions-cell');

    const updatePayload = {
        status: newStatus,
        deliveryDate: newDeliveryDate
    };
    console.log(`Updating order ${orderId} with payload:`, JSON.stringify(updatePayload));

    fetch(`http://localhost:8008/orders/update/${orderId}`, {
        method: 'PUT', // or 'PATCH'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                 throw new Error(`Failed to update order status: ${response.status} ${response.statusText}. ${text}`);
            });
        }
        return response.json();
    })
    .then(updatedOrder => {
        console.log('Order updated successfully:', updatedOrder);
        // Update the cell content
        statusCell.textContent = newStatus;
        deliveryDateCell.textContent = newDeliveryDate ? new Date(newDeliveryDate).toLocaleDateString() : 'N/A'; // Update display date
        row.dataset.deliveryDateRaw = newDeliveryDate; // Update raw date storage

        // Restore the Edit button
        actionsCell.innerHTML = '<button class="edit-btn">Edit</button>';
        actionsCell.querySelector('.edit-btn').addEventListener('click', handleEditClick); // Re-add listener

        // Clean up temporary data attributes
        delete row.dataset.originalStatus;
        delete row.dataset.originalDeliveryDate;
        delete row.dataset.originalDeliveryDateDisplay;
    })
    .catch(error => {
        console.error('Error updating order:', error);
        alert(`Failed to update order: ${error.message}`);
        handleCancelClick(row); // Revert changes on error
    });
}

function handleCancelClick(row) {
    const statusCell = row.querySelector('.status-cell');
    const deliveryDateCell = row.querySelector('.delivery-date-cell');
    const actionsCell = row.querySelector('.actions-cell');
    const originalStatus = row.dataset.originalStatus;
    const originalDeliveryDateDisplay = row.dataset.originalDeliveryDateDisplay;

    // Restore original status and delivery date display
    statusCell.textContent = originalStatus;
    deliveryDateCell.textContent = originalDeliveryDateDisplay;

    // Restore Edit button
    actionsCell.innerHTML = '<button class="edit-btn">Edit</button>';
    actionsCell.querySelector('.edit-btn').addEventListener('click', handleEditClick); // Re-add listener

    // Clean up temporary data attributes
    delete row.dataset.originalStatus;
    delete row.dataset.originalDeliveryDate;
    delete row.dataset.originalDeliveryDateDisplay;
}

// Call displayOrders when the page loads
window.onload = displayOrders;