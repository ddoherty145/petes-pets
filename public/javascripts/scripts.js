if (document.querySelector('#new-pet')) {
  document.querySelector('#new-pet').addEventListener('submit', (e) => {
    e.preventDefault();

    // Create FormData for file uploads
    const formData = new FormData();
    const inputs = document.querySelectorAll('.form-control');
    
    for (const input of inputs) {
      if (input.type === 'file') {
        // Handle file inputs
        if (input.files[0]) {
          formData.append(input.name, input.files[0]);
        }
      } else {
        // Handle text inputs
        formData.append(input.name, input.value);
      }
    }

    axios.post('/pets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then((response) => {
        const alert = document.getElementById('alert');
        alert.classList.add('alert-success');
        alert.textContent = 'Pet saved successfully!';
        alert.style.display = 'block';
        setTimeout(() => {
          alert.style.display = 'none';
          alert.classList.remove('alert-success');
          window.location.replace(`/pets/${response.data.pet._id}`);
        }, 2000);
      })
      .catch((error) => {
        const alert = document.getElementById('alert');
        alert.classList.add('alert-warning');
        alert.textContent = error.response?.data?.errors 
          ? Object.values(error.response.data.errors).map(e => e.message).join(', ')
          : 'Oops, something went wrong. Please check your information and try again.';
        alert.style.display = 'block';
        setTimeout(() => {
          alert.style.display = 'none';
          alert.classList.remove('alert-warning');
        }, 3000);
      });
  });
}
