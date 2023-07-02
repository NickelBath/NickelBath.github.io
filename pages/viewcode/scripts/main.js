const getfile = document.getElementById("getfile")


getfile.addEventListener('change', (event) => {
    const fileList = event.target.files;
    console.log(fileList);
});
document.getElementById('textarea').value = fileList