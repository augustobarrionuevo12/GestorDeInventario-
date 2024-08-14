document.addEventListener("DOMContentLoaded", function () {
    const DateTime = luxon.DateTime;

    const nombreInput = document.getElementById("nombre");
    const cantidadInput = document.getElementById("cantidad");
    const categoriaSelect = document.getElementById("categoria");
    const sedeSelect = document.getElementById("sede");
    const agregarBtn = document.getElementById("agregar");
    const categoriasContainer = document.getElementById("categorias");
    let contadorProductos = 1;
    let categorias = [];

    
    function fetchCategoriesAndProducts() {
        fetch('./data.json')
            .then(response => response.json())
            .then(data => {
                categorias = data.categorias;
                renderCategorias();
                const inventario = data.productos.map(product => ({
                    texto: `${contadorProductos++}. Nombre: ${product.title} - Cantidad: ${product.rating.count} - Categoría: ${product.category} - Sede: N/A - Última modificación: N/A`,
                    categoria: product.category,
                }));
                inventario.forEach(producto => {
                    agregarProductoDOM(producto);
                });
                guardarEnLocalStorage();
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    function renderCategorias() {
        categoriasContainer.innerHTML = '';
        categorias.forEach(categoria => {
            const categoriaCard = document.createElement("div");
            categoriaCard.className = "categoria-card";

            const imagen = document.createElement("img");
            imagen.src = categoria.imagen;
            imagen.alt = categoria.tipoDeProducto;
            categoriaCard.appendChild(imagen);

            const titulo = document.createElement("h2");
            titulo.textContent = categoria.tipoDeProducto;
            categoriaCard.appendChild(titulo);

            const productosContainer = document.createElement("ul");
            productosContainer.id = `${categoria.tipoDeProducto.toLowerCase()}-productos`;
            categoriaCard.appendChild(productosContainer);

            const btnEliminarTodos = document.createElement("button");
            btnEliminarTodos.textContent = "Eliminar Todos";
            btnEliminarTodos.className = "btn-eliminar-todos";
            btnEliminarTodos.addEventListener("click", function () {
                confirmarEliminarTodos(categoria);
            });

            categoriaCard.appendChild(btnEliminarTodos);

            categoriasContainer.appendChild(categoriaCard);
        });
    }

    function confirmarEliminarTodos(categoria) {
        Swal.fire({
            title: `¿Deseas eliminar todos los productos de la categoría "${categoria.tipoDeProducto}"?`,
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlos todos'
        }).then((result) => {
            if (result.isConfirmed) {
                eliminarTodos(categoria);
            }
        });
    }

    function eliminarTodos(categoria) {
        const productosContainer = document.getElementById(`${categoria.tipoDeProducto.toLowerCase()}-productos`);
        productosContainer.innerHTML = "";
        guardarEnLocalStorage();
        Swal.fire(
            '¡Eliminados!',
            'Todos los productos han sido eliminados.',
            'success'
        );
    }

    function guardarEnLocalStorage() {
        const inventario = [];
        categorias.forEach(categoria => {
            const productosContainer = document.getElementById(`${categoria.tipoDeProducto.toLowerCase()}-productos`);
            const productos = productosContainer.getElementsByTagName("li");
            for (let producto of productos) {
                inventario.push({
                    texto: producto.textContent.replace(" X", " "),
                    categoria: categoria.tipoDeProducto
                });
            }
        });
        localStorage.setItem("inventario", JSON.stringify(inventario));
    }

    function cargarDesdeLocalStorage() {
        const inventario = JSON.parse(localStorage.getItem("inventario")) || [];
        inventario.forEach(producto => agregarProductoDOM(producto));
    }

    function agregarProductoDOM(producto) {
        const nuevoProducto = document.createElement("li");
        nuevoProducto.textContent = producto.texto;

        const eliminarBtn = document.createElement("button");
        eliminarBtn.textContent = "X";
        eliminarBtn.className = "btn-eliminar";
        eliminarBtn.addEventListener("click", function () {
            confirmarEliminarProducto(nuevoProducto);
        });

        const modificarBtn = document.createElement("button");
        modificarBtn.textContent = "Modificar";
        modificarBtn.className = "btn-modificar";
        modificarBtn.addEventListener("click", function () {
            modificarProducto(producto, nuevoProducto);
        });

        nuevoProducto.appendChild(eliminarBtn);
        nuevoProducto.appendChild(modificarBtn);

        const productosContainer = document.getElementById(`${producto.categoria.toLowerCase()}-productos`);
        productosContainer.appendChild(nuevoProducto);
    }

    function confirmarEliminarProducto(nuevoProducto) {
        Swal.fire({
            title: '¿Deseas eliminar este producto?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
            if (result.isConfirmed) {
                eliminarProducto(nuevoProducto);
            }
        });
    }

    function eliminarProducto(nuevoProducto) {
        nuevoProducto.remove();
        guardarEnLocalStorage();
        Swal.fire(
            '¡Eliminado!',
            'El producto ha sido eliminado.',
            'success'
        );
    }

    function modificarProducto(producto, nuevoProducto) {
        const [num, ...rest] = producto.texto.split(". ");
        const [nombre, cantidad, categoria, sede, ...fecha] = rest.join(". ").split(" - ").map(item => item.split(": ")[1]);
        
        nombreInput.value = nombre;
        cantidadInput.value = cantidad;
        categoriaSelect.value = categoria;
        sedeSelect.value = sede;

        eliminarProducto(nuevoProducto);
    }

    agregarBtn.addEventListener("click", function () {
        const nombre = nombreInput.value.trim();
        const cantidad = parseInt(cantidadInput.value.trim(), 10);
        const categoria = categoriaSelect.value;
        const sede = sedeSelect.value;

        if (nombre === "" || isNaN(cantidad) || cantidad <= 0 || categoria === "" || sede === "") {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, completa todos los campos con datos válidos.',
            });
            return;
        }

        const now = DateTime.now().toLocaleString(DateTime.DATETIME_MED);

        const nuevoProducto = {
            texto: `${contadorProductos++}. Nombre: ${nombre} - Cantidad: ${cantidad} - Categoría: ${categoria} - Sede: ${sede} - Última modificación: ${now}`,
            categoria
        };

        agregarProductoDOM(nuevoProducto);

        nombreInput.value = "";
        cantidadInput.value = "";
        categoriaSelect.selectedIndex = 0;
        sedeSelect.selectedIndex = 0;

        guardarEnLocalStorage();

        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Item añadido',
        });
    });

    document.getElementById("buscar").addEventListener("click", function () {
        const nombreFiltro = document.getElementById("buscarNombre").value.toLowerCase();
        const categoriaFiltro = document.getElementById("buscarCategoria").value;

        categorias.forEach(categoria => {
            const productosContainer = document.getElementById(`${categoria.tipoDeProducto.toLowerCase()}-productos`);
            const productos = productosContainer.getElementsByTagName("li");
            for (let producto of productos) {
                const nombreProducto = producto.textContent.toLowerCase();
                const categoriaProducto = categoria.tipoDeProducto;

                if ((nombreFiltro === "" || nombreProducto.includes(nombreFiltro)) &&
                    (categoriaFiltro === "" || categoriaProducto === categoriaFiltro)) {
                    producto.style.display = "";
                } else {
                    producto.style.display = "none";
                }
            }
        });
    });

    fetchCategoriesAndProducts();
    cargarDesdeLocalStorage();
});
