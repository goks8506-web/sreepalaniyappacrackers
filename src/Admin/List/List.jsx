import { useState, useEffect } from "react"
import Modal from "react-modal"
import Sidebar from "../Sidebar/Sidebar"
import "../../App.css"
import { API_BASE_URL } from "../../../Config"
import { FaEye, FaEdit, FaTrash, FaSearch, FaDownload, FaUpload, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaTimes, FaFileArchive } from "react-icons/fa"
import Logout from "../Logout"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import need from '../../default.jpg';

Modal.setAppElement("#root")

// Canonical display order for product types. Kept in sync with the
// ORDERED_TYPES array used in Pricelist.jsx so admin views and the
// customer-facing pricelist always present categories in the same order.
const ORDERED_TYPES = [
  "One sound crackers", "One Sound Crackers Premium", "Chorsa and Gaints", "Delux Crackers",
  "Bijili Crackers", "Bombs", "Paper Bombs", "Twinkling Star", "Rockets",
  "Kids Special", "Matches", "Flower Pots", "Colour Fountain Mini", "Colour Fountain Mega", "Crackling Fountain",
  "Ground Chakkars", "New Arrivals", "Vip Special Crackers",
  "Sparklers", "Premium Sparklers", "Sky Shot Mini", "Sky Shot Single", "Grand Sky Shot", "Fun And Crazy Sky Shot",
  "Repeating Shots", "Multi Shots", "Comets Sky Shots", "Premium Set Out", "Fancy pencil",
  "Fountain and Fancy Novelties", "Guns and Caps", "Gift Boxes",
]

const PaginBtn = ({ label, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all duration-150
      ${active ? "bg-indigo-600 border-indigo-600 text-white"
        : disabled ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
          : "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:text-indigo-600"}`}
  >
    {label}
  </button>
)

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
const Field = ({ label, required, children, half }) => (
  <div className={half ? "" : ""}>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

export default function List() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [productTypes, setProductTypes] = useState([])
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [editModalIsOpen, setEditModalIsOpen] = useState(false)
  const [addModalIsOpen, setAddModalIsOpen] = useState(false)
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productToDelete, setProductToDelete] = useState(null)
  const [error, setError] = useState("")
  const [discountWarning, setDiscountWarning] = useState("")
  const [toggleStates, setToggleStates] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [brands, setBrands] = useState([])
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false)
  const [isDownloadingImages, setIsDownloadingImages] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })
  const [bulkUploadModalIsOpen, setBulkUploadModalIsOpen] = useState(false)
  const [bulkFiles, setBulkFiles] = useState([])
  const [bulkUnmatched, setBulkUnmatched] = useState([])
  const [bulkMatchedCount, setBulkMatchedCount] = useState(0)
  const [bulkProcessingFiles, setBulkProcessingFiles] = useState(false)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkUploadProgress, setBulkUploadProgress] = useState({ current: 0, total: 0, percent: 0 })
  const [bulkUploadResult, setBulkUploadResult] = useState(null)
  const [replaceExistingImages, setReplaceExistingImages] = useState(true)
  const [formData, setFormData] = useState({
    productname: "", serial_number: "", price: "", discount: "", per: "", product_type: "",
    description: "", box_count: 1, brand: "", free: false, images: [], existingImages: [], imagesToDelete: [],
  })

  const productsPerPage = 10

  const fetchData = async (url, errorMsg, setter) => {
    try {
      const response = await fetch(url)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || errorMsg)
      setter(data)
    } catch (err) { setError(err.message) }
  }

  // Sorts a flat list of product_type keys (e.g. "one_sound_crackers") so
  // that they follow the order defined in ORDERED_TYPES. Any product type
  // returned by the API that isn't present in ORDERED_TYPES is not dropped —
  // it's appended at the end, sorted alphabetically, so newly created
  // product types remain visible until someone adds them to ORDERED_TYPES.
  const arrangeProductTypes = (types) => {
    const orderRank = new Map(
      ORDERED_TYPES.map((t, i) => [t.replace(/\s+/g, "_").toLowerCase(), i])
    )
    return [...types].sort((a, b) => {
      const rankA = orderRank.has(a) ? orderRank.get(a) : Infinity
      const rankB = orderRank.has(b) ? orderRank.get(b) : Infinity
      if (rankA !== rankB) return rankA - rankB
      return a.localeCompare(b)
    })
  }

  const fetchProductTypes = () =>
    fetchData(`${API_BASE_URL}/api/product-types`, "Failed to fetch product types", (data) =>
      setProductTypes(
        arrangeProductTypes(
          data.filter((item) => item.product_type !== "gift_box_dealers").map((item) => item.product_type)
        )
      ))

  const fetchBrands = () =>
    fetchData(`${API_BASE_URL}/api/brands`, "Failed to fetch brands", (data) => setBrands(data))

  const fetchProducts = () =>
    fetchData(`${API_BASE_URL}/api/products`, "Failed to fetch products", (data) => {
      const normalizedData = data.data
        .filter((product) => product.product_type !== "gift_box_dealers")
        .map((product) => ({
          ...product,
          images: product.image ? (typeof product.image === "string" ? JSON.parse(product.image) : product.image) : [],
          box_count: product.box_count || 1,
        }))
        .sort((a, b) => a.serial_number.localeCompare(b.serial_number))
      setProducts(normalizedData)
      applyFilters(normalizedData, filterType, searchQuery)
      setToggleStates(normalizedData.reduce((acc, p) => ({
        ...acc,
        [`${p.product_type}-${p.id}`]: p.status === "on",
        [`fast-${p.product_type}-${p.id}`]: p.fast_running === true,
        [`free-${p.product_type}-${p.id}`]: p.free === true,
      }), {}))
    })

  const applyFilters = (productsData, type, query) => {
    let filtered = productsData
    if (type !== "all") filtered = filtered.filter((p) => p.product_type === type)
    if (query) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter((p) => p.productname.toLowerCase().includes(lowerQuery) || p.serial_number.toLowerCase().includes(lowerQuery))
    }
    setFilteredProducts(filtered)
  }

  const handleToggle = async (product, endpoint, keyPrefix) => {
    const productKey = `${keyPrefix}${product.product_type}-${product.id}`
    const tableName = product.product_type.toLowerCase().replace(/\s+/g, "_")
    try {
      setToggleStates((prev) => ({ ...prev, [productKey]: !prev[productKey] }))
      const response = await fetch(`${API_BASE_URL}/api/products/${tableName}/${product.id}/${endpoint}`, { method: "PATCH" })
      if (!response.ok) {
        setToggleStates((prev) => ({ ...prev, [productKey]: !prev[productKey] }))
        throw new Error(`Failed to toggle ${endpoint}`)
      }
      fetchProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  const chunkArray = (arr, size) => {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
    return chunks
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const toggleProductStatus = async (product, attempt = 0) => {
    const tableName = product.product_type.toLowerCase().replace(/\s+/g, "_")
    const res = await fetch(`${API_BASE_URL}/api/products/${tableName}/${product.id}/toggle-status`, { method: "PATCH" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg = data.error || data.message || `Failed to toggle status for ${product.productname}`
      const isConnectionLimit = /too many clients|connection/i.test(msg)
      if (isConnectionLimit && attempt < 3) {
        await sleep(300 * (attempt + 1))
        return toggleProductStatus(product, attempt + 1)
      }
      throw new Error(msg)
    }
  }

  const handleBulkStatusToggle = async (turnOn) => {
    const targets = filteredProducts.filter((p) => {
      const key = `${p.product_type}-${p.id}`
      const current = toggleStates[key] ?? (p.status === "on")
      return current !== turnOn
    })
    if (targets.length === 0) return

    setBulkStatusLoading(true)
    setError("")

    setToggleStates((prev) => {
      const updated = { ...prev }
      targets.forEach((p) => { updated[`${p.product_type}-${p.id}`] = turnOn })
      return updated
    })

    const BATCH_SIZE = 15
    const batches = chunkArray(targets, BATCH_SIZE)
    let hadError = false

    try {
      for (const batch of batches) {
        const results = await Promise.allSettled(batch.map((product) => toggleProductStatus(product)))
        const failed = results.filter((r) => r.status === "rejected")
        if (failed.length > 0) {
          hadError = true
          setError(failed[0].reason?.message || "Some products failed to update.")
        }
      }
    } catch (err) {
      hadError = true
      setError(err.message || "Some products failed to update.")
    } finally {
      fetchProducts()
      setBulkStatusLoading(false)
      if (!hadError) setError("")
    }
  }

  useEffect(() => {
    const savedPage = sessionStorage.getItem('listPage')
    if (savedPage) setCurrentPage(Number(savedPage))
  }, [])

  useEffect(() => { sessionStorage.setItem('listPage', currentPage.toString()) }, [currentPage])

  useEffect(() => {
    fetchProductTypes()
    fetchProducts()
    fetchBrands()
    const intervalId = setInterval(() => { fetchProductTypes(); fetchProducts(); fetchBrands() }, 300000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => { applyFilters(products, filterType, searchQuery) }, [filterType, searchQuery, products])

  const handleDownloadAllImages = async () => {
    if (products.length === 0) {
      setError("No products to download images from.")
      return
    }

    // Collect all valid image URLs across all products (both on and off status)
    const queue = []
    products.forEach((product) => {
      const images = Array.isArray(product.images)
        ? product.images
        : (product.image ? (typeof product.image === "string" ? JSON.parse(product.image) : product.image) : [])

      const cleanName = (product.productname || "Unknown")
        .trim()
        .replace(/[/\\?%*:|"<>]/g, "_")

      const validImages = (images || []).filter((url) => typeof url === "string" && !url.includes("/video/"))

      validImages.forEach((url, idx) => {
        const ext = url.split(".").pop().split(/[?#]/)[0] || "jpg"
        const fileName = validImages.length === 1
          ? `${cleanName}.${ext}`
          : `${cleanName}_${idx + 1}.${ext}`
        queue.push({ url, fileName, product })
      })
    })

    if (queue.length === 0) {
      setError("No valid images found on products.")
      return
    }

    setIsDownloadingImages(true)
    setDownloadProgress({ current: 0, total: queue.length })
    setError("")

    const zip = new JSZip()
    const folder = zip.folder("Product_Images")

    const fetchBlob = async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error("Direct fetch failed")
        return await res.blob()
      } catch {
        // Fallback to server proxy to bypass CORS issues on Cloudinary URLs
        const proxyUrl = `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(url)}`
        const proxyRes = await fetch(proxyUrl)
        if (!proxyRes.ok) throw new Error("Proxy fetch failed")
        return await proxyRes.blob()
      }
    }

    const CONCURRENCY = 6
    let currentIndex = 0
    let completedCount = 0

    const worker = async () => {
      while (currentIndex < queue.length) {
        const itemIndex = currentIndex++
        const item = queue[itemIndex]
        try {
          const blob = await fetchBlob(item.url)
          folder.file(item.fileName, blob)
        } catch (err) {
          console.warn(`Failed to download ${item.fileName} from ${item.url}:`, err.message)
        } finally {
          completedCount++
          setDownloadProgress({ current: completedCount, total: queue.length })
        }
      }
    }

    try {
      const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker())
      await Promise.all(workers)

      const zipBlob = await zip.generateAsync({ type: "blob" })
      saveAs(zipBlob, "all_product_images.zip")
    } catch (err) {
      setError("Failed to create ZIP file: " + err.message)
    } finally {
      setIsDownloadingImages(false)
      setDownloadProgress({ current: 0, total: 0 })
    }
  }

  const findProductForImage = (filename, list) => {
    if (!filename || !list || !list.length) return null
    const norm = (s) => (s || "").toLowerCase().replace(/[/\\_\-\s]+/g, " ").trim()
    const alpha = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")

    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "").trim()
    const baseName = nameWithoutExt.replace(/(_img\d+|_image\d+|_\d+|\s*\(\d+\))$/i, "").trim()
    const targetNorm = norm(baseName)
    const targetAlpha = alpha(baseName)

    // 1. Exact normalized name
    let match = list.find((p) => norm(p.productname) === targetNorm)
    if (match) return match

    // 2. Alphanumeric name match
    match = list.find((p) => alpha(p.productname) === targetAlpha)
    if (match) return match

    // 3. Serial number exact
    match = list.find((p) => p.serial_number && norm(p.serial_number) === targetNorm)
    if (match) return match

    // 4. Combined serial + name
    match = list.find(
      (p) =>
        targetNorm === norm(`${p.serial_number} ${p.productname}`) ||
        targetNorm === norm(`${p.serial_number}_${p.productname}`) ||
        targetAlpha === alpha(`${p.serial_number}${p.productname}`)
    )
    if (match) return match

    // 5. Starts with serial
    match = list.find((p) => {
      if (!p.serial_number) return false
      const sNorm = norm(p.serial_number)
      if (targetNorm.startsWith(sNorm)) {
        const rest = targetNorm.slice(sNorm.length).trim()
        return norm(p.productname) === rest || alpha(p.productname) === alpha(rest)
      }
      return false
    })
    if (match) return match

    return null
  }

  const processRawFiles = async (rawFiles) => {
    setBulkProcessingFiles(true)
    setBulkUploadResult(null)
    const extractedFiles = []

    for (const file of rawFiles) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const zip = await JSZip.loadAsync(file)
          const entries = Object.keys(zip.files)
          for (const entryName of entries) {
            const entry = zip.files[entryName]
            if (entry.dir) continue
            if (!/\.(jpe?g|png|gif|webp)$/i.test(entryName)) continue
            const blob = await entry.async("blob")
            const fileName = entryName.split("/").pop().split("\\").pop()
            if (!fileName) continue
            const ext = fileName.split(".").pop().toLowerCase()
            const mimeType = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg"
            const extractedFile = new File([blob], fileName, { type: mimeType })
            extractedFiles.push(extractedFile)
          }
        } catch (err) {
          setError("Failed to read ZIP file: " + err.message)
        }
      } else if (/\.(jpe?g|png|gif|webp)$/i.test(file.name)) {
        extractedFiles.push(file)
      }
    }

    const matched = []
    const unmatched = []
    const matchedProductIds = new Set()

    for (const file of extractedFiles) {
      const match = findProductForImage(file.name, products)
      if (match) {
        matched.push({ file, product: match, fileName: file.name })
        matchedProductIds.add(`${match.product_type}-${match.id}`)
      } else {
        unmatched.push(file.name)
      }
    }

    setBulkFiles(matched)
    setBulkUnmatched(unmatched)
    setBulkMatchedCount(matchedProductIds.size)
    setBulkProcessingFiles(false)
  }

  const handleBulkFileInput = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      processRawFiles(files)
    }
  }

  const handleStartBulkUpload = async () => {
    if (bulkFiles.length === 0) return
    setBulkUploading(true)
    setError("")
    setBulkUploadResult(null)

    const CHUNK_SIZE = 20
    const chunks = chunkArray(bulkFiles, CHUNK_SIZE)
    let totalUploaded = 0
    let totalProductsUpdated = 0
    let allUnmatched = [...bulkUnmatched]

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const formData = new FormData()
        formData.append("replaceExisting", replaceExistingImages ? "true" : "false")
        chunk.forEach((item) => {
          formData.append("images", item.file, item.fileName)
        })

        const res = await fetch(`${API_BASE_URL}/api/products/bulk-upload-images`, {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || data.error || `Batch ${i + 1} upload failed`)
        }

        totalUploaded += chunk.length
        totalProductsUpdated += (data.updatedCount || 0)
        if (data.unmatchedFiles && data.unmatchedFiles.length) {
          allUnmatched = [...new Set([...allUnmatched, ...data.unmatchedFiles])]
        }

        setBulkUploadProgress({
          current: totalUploaded,
          total: bulkFiles.length,
          percent: Math.round((totalUploaded / bulkFiles.length) * 100),
        })
      }

      setBulkUploadResult({
        success: true,
        updatedProductsCount: totalProductsUpdated || bulkMatchedCount,
        totalFilesUploaded: totalUploaded,
        unmatchedCount: allUnmatched.length,
      })
      fetchProducts()
    } catch (err) {
      setError("Bulk upload error: " + err.message)
      setBulkUploadResult({
        success: false,
        error: err.message,
      })
    } finally {
      setBulkUploading(false)
    }
  }

  const resetBulkUploadModal = () => {
    setBulkUploadModalIsOpen(false)
    setBulkFiles([])
    setBulkUnmatched([])
    setBulkMatchedCount(0)
    setBulkUploadResult(null)
    setBulkUploading(false)
    setBulkUploadProgress({ current: 0, total: 0, percent: 0 })
    setMigrationStatus("")
  }

  const handleMigrateLegacyCloudName = async () => {
    setMigratingCloudName(true)
    setMigrationStatus("")
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/replace-cloud-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldCloudName: "bqbgj4yl" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Migration failed")
      setMigrationStatus(data.message)
      fetchProducts()
    } catch (err) {
      setMigrationStatus("Error: " + err.message)
    } finally {
      setMigratingCloudName(false)
    }
  }

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "video/mp4", "video/webm", "video/ogg"]
    const validFiles = []
    for (const file of files) {
      if (!allowedTypes.includes(file.type.toLowerCase())) { setError("Only JPG, PNG, GIF images and MP4, WebM, Ogg videos are allowed"); return }
      if (file.size > 5 * 1024 * 1024) { setError("Each file must be less than 5MB"); return }
      validFiles.push(file)
    }
    setError("")
    setFormData((prev) => ({ ...prev, images: validFiles }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === "discount") {
      const numValue = parseFloat(value)
      if (value === "") { setDiscountWarning(""); setFormData((prev) => ({ ...prev, [name]: value })) }
      else if (isNaN(numValue) || numValue < 0 || numValue > 100) { setDiscountWarning("Discount must be between 0 and 100%"); setFormData((prev) => ({ ...prev, [name]: numValue < 0 ? "0" : "100" })) }
      else { setDiscountWarning(""); setFormData((prev) => ({ ...prev, [name]: value })) }
    } else { setFormData((prev) => ({ ...prev, [name]: value })) }
  }

  const handleSubmit = async (e, isEdit) => {
    e.preventDefault()
    setDiscountWarning(""); setError("")
    if (!formData.productname.trim() || !formData.serial_number.trim() || !formData.price || !formData.per || formData.discount === "" || !formData.product_type) { setError("Please fill in all required fields"); return }
    const price = parseFloat(formData.price)
    const discount = parseFloat(formData.discount)
    if (isNaN(price) || price < 0) { setError("Price must be a valid positive number"); return }
    if (isNaN(discount) || discount < 0 || discount > 100) { setError("Discount must be between 0 and 100%"); return }
    if (formData.product_type === "gift_box_dealers") { setError('Product type "gift_box_dealers" is not allowed'); return }
    const formDataToSend = new FormData()
    formDataToSend.append("productname", formData.productname)
    formDataToSend.append("serial_number", formData.serial_number)
    formDataToSend.append("price", formData.price)
    formDataToSend.append("per", formData.per)
    formDataToSend.append("discount", formData.discount)
    formDataToSend.append("description", formData.description || "")
    formDataToSend.append("product_type", formData.product_type)
    formDataToSend.append("box_count", Math.max(1, parseInt(formData.box_count) || 1))
    formDataToSend.append("brand", formData.brand || "")
    formDataToSend.append("free", formData.free ? "true" : "false")
    if (isEdit) {
      const remaining = formData.existingImages || []
      if (remaining.length > 0) formDataToSend.append("existingImages", JSON.stringify(remaining))
    }
    formData.images.forEach((file) => formDataToSend.append("images", file))
    const url = isEdit
      ? `${API_BASE_URL}/api/products/${selectedProduct.product_type.toLowerCase().replace(/\s+/g, "_")}/${selectedProduct.id}`
      : `${API_BASE_URL}/api/products`
    try {
      const response = await fetch(url, { method: isEdit ? "PUT" : "POST", body: formDataToSend })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || `Failed to ${isEdit ? "update" : "add"} product`)
      fetchProducts(); closeModal(); e.target.reset()
      setFormData({ productname: "", serial_number: "", price: "", discount: "", per: "", product_type: "", description: "", box_count: 1, brand: "", free: false, images: [], existingImages: [], imagesToDelete: [] })
    } catch (err) { setError(err.message) }
  }

  const handleDelete = async (product) => {
    try {
      await fetch(`${API_BASE_URL}/api/products/${product.product_type.toLowerCase().replace(/\s+/g, "_")}/${product.id}`, { method: "DELETE" })
      fetchProducts(); setDeleteModalIsOpen(false); setProductToDelete(null)
    } catch (err) { setError("Failed to delete product") }
  }

  const openDeleteModal = (product) => { setProductToDelete(product); setDeleteModalIsOpen(true) }

  const closeModal = () => {
    setModalIsOpen(false); setEditModalIsOpen(false); setAddModalIsOpen(false); setDeleteModalIsOpen(false)
    setSelectedProduct(null); setProductToDelete(null); setError(""); setDiscountWarning("")
    setFormData({ productname: "", serial_number: "", price: "", discount: "", per: "", product_type: "", description: "", box_count: 1, brand: "", free: false, images: [], existingImages: [], imagesToDelete: [] })
  }

  const capitalize = (str) => str ? str.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : ""

  const serialSort = (a, b) => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    return collator.compare(a.serial_number, b.serial_number);
  };

  const formatPrice = (price) => {
    const num = Number.parseFloat(price);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const downloadPDF = async () => {
    if (!products.length) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yOffset = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SRI PALANIYAPPA CRACKERS', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('www.sripalaniyappacrackers.com   |   +91 81242 5943', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
    const year = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric' });
    doc.text(`PRICELIST - ${year}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;

    const orderedTypes = ORDERED_TYPES;

    const fetchImageAsBase64 = (url) => {
      return new Promise((resolve) => {
        if (!url) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX = 80;
            let w = img.naturalWidth, h = img.naturalHeight;
            if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
            else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          } catch { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    const imageCache = {};
    const allProducts = orderedTypes.flatMap(type => {
      const typeKey = type.replace(/ /g, "_").toLowerCase();
      return products.filter(p => p.product_type.toLowerCase() === typeKey);
    });

    await Promise.all(
      allProducts.map(async (product) => {
        const images = Array.isArray(product.images) ? product.images : [];
        const imgUrl = images.find(img => img && !img.includes('/video/') && !img.toLowerCase().endsWith('.gif'));
        if (imgUrl) {
          imageCache[product.serial_number] = await fetchImageAsBase64(imgUrl);
        }
      })
    );

    const ROW_HEIGHT = 18;
    const IMG_SIZE = 14;

    for (const type of orderedTypes) {
      const typeKey = type.replace(/ /g, "_").toLowerCase();
      const typeProducts = products.filter(p => p.product_type.toLowerCase() === typeKey).sort(serialSort);
      if (!typeProducts.length) continue;

      const sectionHeaderHeight = 10;
      if (yOffset + sectionHeaderHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFillColor(200, 200, 200);
      doc.rect(10, yOffset, pageWidth - 20, sectionHeaderHeight, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(capitalize(type), 14, yOffset + 7);
      yOffset += sectionHeaderHeight + 1;

      const colHeaderHeight = 8;
      doc.setFillColor(234, 88, 12);
      doc.rect(10, yOffset, pageWidth - 20, colHeaderHeight, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);

      const cols = { sl: 12, code: 23, img: 39, name: 61, rate: 131, disc: 152, per: 176 };
      doc.text('Sl', cols.sl, yOffset + 5.5);
      doc.text('Code', cols.code, yOffset + 5.5);
      doc.text('Image', cols.img, yOffset + 5.5);
      doc.text('Product Name', cols.name, yOffset + 5.5);
      doc.text('Rate', cols.rate, yOffset + 5.5);
      doc.text('Disc. Rate', cols.disc, yOffset + 5.5);
      doc.text('Per', cols.per, yOffset + 5.5);
      yOffset += colHeaderHeight + 1;

      let slNo = 1;
      for (const product of typeProducts) {
        if (yOffset + ROW_HEIGHT > doc.internal.pageSize.getHeight() - 15) {
          doc.addPage();
          yOffset = 20;
        }

        const discount = product.price * (product.discount / 100);
        const discountedRate = product.price - discount;

        if (slNo % 2 === 0) {
          doc.setFillColor(255, 247, 237);
          doc.rect(10, yOffset, pageWidth - 20, ROW_HEIGHT, 'F');
        }

        doc.setDrawColor(220, 220, 220);
        doc.rect(10, yOffset, pageWidth - 20, ROW_HEIGHT);

        [21, 37, 59, 129, 150, 173].forEach(x => {
          doc.line(x, yOffset, x, yOffset + ROW_HEIGHT);
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(50, 50, 50);

        const textY = yOffset + ROW_HEIGHT / 2 + 1.5;

        doc.text(String(slNo++), cols.sl, textY);
        doc.text(product.serial_number || '', cols.code, textY);

        const nameLines = doc.splitTextToSize(product.productname, 66);
        const nameY = nameLines.length > 1 ? yOffset + 5 : textY;
        doc.text(nameLines.slice(0, 2), cols.name, nameY);

        doc.text(`Rs.${formatPrice(product.price)}`, cols.rate, textY);
        doc.text(`Rs.${formatPrice(discountedRate)}`, cols.disc, textY);
        doc.text(product.per || '', cols.per, textY);

        const imgData = imageCache[product.serial_number];
        const imgX = cols.img - 1;
        const imgY = yOffset + (ROW_HEIGHT - IMG_SIZE) / 2;
        if (imgData) {
          try { doc.addImage(imgData, 'JPEG', imgX, imgY, IMG_SIZE, IMG_SIZE); } catch { }
        } else {
          try { doc.addImage(need, 'JPEG', imgX, imgY, IMG_SIZE, IMG_SIZE); } catch { }
        }

        yOffset += ROW_HEIGHT;
      }

      yOffset += 6;
    }

    doc.save('MNC_Pricelist_2025.pdf');
  };

  const renderMedia = (media, idx, sizeClass) => {
    let src, isVideo = false
    if (media instanceof File) { src = URL.createObjectURL(media); isVideo = media.type.startsWith("video/") }
    else if (typeof media === "string") { src = media; isVideo = media.includes("/video/") }
    else return <span key={idx} className="text-slate-400 text-xs">Invalid media</span>
    return isVideo
      ? <video key={idx} src={src} controls className={`${sizeClass} object-cover rounded-lg inline-block`} />
      : <img key={idx} src={src || "/placeholder.svg"} alt={`media-${idx}`} className={`${sizeClass} object-cover rounded-lg inline-block`} />
  }

  const handleDeleteExistingImage = (indexToDelete) => {
    setFormData((prev) => ({ ...prev, existingImages: prev.existingImages.filter((_, index) => index !== indexToDelete), imagesToDelete: [...prev.imagesToDelete, indexToDelete] }))
  }

  const Toggle = ({ checked, onChange, color }) => (
    <label className="inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${checked ? (color === "blue" ? "bg-indigo-500" : color === "orange" ? "bg-orange-400" : "bg-emerald-500") : "bg-slate-300"}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </label>
  )

  const renderModalForm = (isEdit) => (
    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-extrabold text-slate-800 mb-6 text-center">
        {isEdit ? "✏️ Edit Product" : "➕ Add Product"}
      </h2>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-xs">⚠️ {error}</div>}
      <form onSubmit={(e) => handleSubmit(e, isEdit)}>
        <div className="space-y-4">
          {!isEdit && (
            <Field label="Product Type" required>
              <select name="product_type" value={formData.product_type} onChange={handleInputChange} className={inputCls} required>
                <option value="">Select product type...</option>
                {productTypes.map((type) => <option key={type} value={type}>{capitalize(type)}</option>)}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Product Name" required>
              <input type="text" name="productname" value={formData.productname} onChange={handleInputChange} placeholder="e.g. Ground Chakkar" className={inputCls} required />
            </Field>
            <Field label="Serial Number" required>
              <input type="text" name="serial_number" value={formData.serial_number} onChange={handleInputChange} placeholder="e.g. SN-001" className={inputCls} required />
            </Field>
            <Field label="Price (₹)" required>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" placeholder="0.00" className={inputCls} required />
            </Field>
            <Field label="Discount (%)" required>
              <div>
                <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} step="0.01" min="0" max="100" placeholder="0" className={`${inputCls} ${discountWarning ? "border-red-400" : ""}`} required />
                {discountWarning && <p className="mt-1 text-xs text-red-500 font-medium">{discountWarning}</p>}
              </div>
            </Field>
            <Field label="Per" required>
              <select name="per" value={formData.per} onChange={handleInputChange} className={inputCls} required>
                <option value="">Select unit...</option>
                {["pieces", "box", "pkt"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </Field>
            <Field label="Box Count" required>
              <input type="number" name="box_count" value={formData.box_count} onChange={handleInputChange} min="1" className={inputCls} required />
            </Field>
            <Field label="Brand">
              <select name="brand" value={formData.brand} onChange={handleInputChange} className={inputCls}>
                <option value="">Select brand...</option>
                {brands.map((b) => <option key={b.id} value={b.brand_name}>{b.brand_name}</option>)}
              </select>
            </Field>
            <Field label="Free">
              <div className="flex items-center gap-3 h-10">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only" checked={formData.free} onChange={(e) => setFormData((prev) => ({ ...prev, free: e.target.checked }))} />
                  <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${formData.free ? "bg-orange-400" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${formData.free ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </label>
                <span className="text-xs font-medium text-slate-600">{formData.free ? "On" : "Off"}</span>
              </div>
            </Field>
          </div>
          <Field label="Description">
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" placeholder="Enter product description..." className={`${inputCls} resize-none`} />
          </Field>
          <Field label={isEdit ? "Manage Images" : "Images"}>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
              <input type="file" name="images" multiple onChange={handleImageChange} accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm,video/ogg"
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-colors" />
              <p className="text-xs text-slate-400 mt-2">JPG, PNG, GIF, MP4, WebM, Ogg — max 5MB each</p>
            </div>
            {isEdit && formData.existingImages.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Images</p>
                <div className="flex flex-wrap gap-2">
                  {formData.existingImages.map((file, idx) => (
                    <div key={idx} className="relative">
                      {renderMedia(file, idx, "h-20 w-20")}
                      <button type="button" onClick={() => handleDeleteExistingImage(idx)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {formData.images.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">New Uploads</p>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((file, idx) => (
                    <div key={idx} className="relative">
                      {renderMedia(file, idx, "h-20 w-20")}
                      <button type="button" onClick={() => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Field>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200">
              {isEdit ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )

  const indexOfFirstProduct = (currentPage - 1) * productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfFirstProduct + productsPerPage)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Product List</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Manage and browse all inventory products</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">⚠️ {error}</div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-6">
            <div className="flex flex-wrap gap-3 items-end justify-between">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-44">
                  <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Product Type</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={inputCls}>
                    <option value="all">All Types</option>
                    {productTypes.map((type) => <option key={type} value={type}>{capitalize(type)}</option>)}
                  </select>
                </div>
                <div className="min-w-56">
                  <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input type="text" placeholder="Name or serial number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border" />
                  </div>
                </div>
                <div className="min-w-48">
                  <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">
                    Bulk Status {filterType === "all" ? "(All Products)" : `(${capitalize(filterType)})`}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkStatusToggle(true)}
                      disabled={bulkStatusLoading}
                      className="h-10 px-3 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                      {bulkStatusLoading ? "..." : "Turn All ON"}
                    </button>
                    <button
                      onClick={() => handleBulkStatusToggle(false)}
                      disabled={bulkStatusLoading}
                      className="h-10 px-3 rounded-xl text-xs font-bold text-white bg-slate-500 hover:bg-slate-600 disabled:opacity-50 transition-colors"
                    >
                      {bulkStatusLoading ? "..." : "Turn All OFF"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setAddModalIsOpen(true)} className="h-10 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200">
                  + Add Product
                </button>
                <button onClick={downloadPDF} className="h-10 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-slate-600 to-slate-500 shadow-lg shadow-slate-200 hover:from-slate-700 hover:to-slate-600 transition-all duration-200 flex items-center gap-1.5">
                  <FaDownload className="text-xs" /> Pricelist
                </button>
                <button
                  onClick={handleDownloadAllImages}
                  disabled={isDownloadingImages}
                  className="h-10 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-500 disabled:opacity-60 transition-all duration-200 flex items-center gap-1.5"
                  title="Download all product images into a ZIP file"
                >
                  {isDownloadingImages ? (
                    <>
                      <FaSpinner className="animate-spin text-xs" />
                      {downloadProgress.total > 0 ? `Downloading (${downloadProgress.current}/${downloadProgress.total})` : "Downloading..."}
                    </>
                  ) : (
                    <>
                      <FaDownload className="text-xs" /> Download Images
                    </>
                  )}
                </button>
                <button
                  onClick={() => setBulkUploadModalIsOpen(true)}
                  className="h-10 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-amber-500 to-amber-400 shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-amber-500 transition-all duration-200 flex items-center gap-1.5"
                  title="Bulk upload images matching by product name"
                >
                  <FaUpload className="text-xs" /> Bulk Upload Images
                </button>
              </div>
            </div>
          </div>

          {currentProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-slate-400 font-medium text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mb-6">
              {currentProducts.map((product) => {
                const productKey = `${product.product_type}-${product.id}`
                return (
                  <div key={productKey} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-extrabold text-indigo-500 tracking-wide">{product.serial_number}</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5 truncate">{product.productname}</div>
                        <div className="text-xs text-slate-400">{capitalize(product.product_type)}</div>
                        {product.brand && <div className="text-xs text-slate-500 font-medium mt-0.5">🏭 {product.brand}</div>}
                      </div>
                    </div>

                    {product.images.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {product.images.slice(0, 3).map((media, idx) => renderMedia(media, idx, "h-14 w-14"))}
                        {product.images.length > 3 && <div className="h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">+{product.images.length - 3}</div>}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {[
                        ["💰 Price", `₹${parseFloat(product.price).toFixed(2)}`],
                        ["📦 Per", product.per],
                        ["🏷️ Discount", `${parseFloat(product.discount).toFixed(2)}%`],
                        ["📫 Box Count", product.box_count],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-slate-50 rounded-lg px-2 py-1.5">
                          <div className="text-xs font-bold text-slate-400">{label}</div>
                          <div className="text-xs font-semibold text-slate-700">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Status</span>
                        <Toggle checked={toggleStates[productKey]} onChange={() => handleToggle(product, "toggle-status", "")} color="green" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Fast</span>
                        <Toggle checked={toggleStates[`fast-${productKey}`]} onChange={() => handleToggle(product, "toggle-fast-running", "fast-")} color="blue" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Free</span>
                        <Toggle checked={toggleStates[`free-${productKey}`]} onChange={() => handleToggle(product, "toggle-free", "free-")} color="orange" />
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button onClick={() => { setSelectedProduct(product); setModalIsOpen(true) }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200">
                        <FaEye className="text-xs" /> View
                      </button>
                      <button onClick={() => {
                        setSelectedProduct(product)
                        setFormData({
                          productname: product.productname,
                          serial_number: product.serial_number,
                          price: product.price,
                          discount: product.discount,
                          per: product.per,
                          product_type: product.product_type,
                          description: product.description || "",
                          box_count: product.box_count,
                          brand: product.brand || "",
                          free: product.free === true,
                          images: [],
                          existingImages: product.images || [],
                          imagesToDelete: []
                        })
                        setEditModalIsOpen(true)
                      }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200">
                        <FaEdit className="text-xs" /> Edit
                      </button>
                      <button onClick={() => openDeleteModal(product)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200">
                        <FaTrash className="text-xs" /> Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              <PaginBtn label="← Prev" onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0) }} disabled={currentPage === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((page) => (
                <PaginBtn key={page} label={page} onClick={() => { setCurrentPage(page); window.scrollTo(0, 0) }} active={currentPage === page} />
              ))}
              <PaginBtn label="Next →" onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0) }} disabled={currentPage === totalPages} />
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black/50">
        {selectedProduct && (
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-slate-800 mb-6 text-center">📦 Product Details</h2>
            {selectedProduct.images.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {selectedProduct.images.map((media, idx) => renderMedia(media, idx, "h-24 w-24"))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ["Type", capitalize(selectedProduct.product_type)],
                ["Serial No.", selectedProduct.serial_number],
                ["Product Name", selectedProduct.productname],
                ["Price", `₹${parseFloat(selectedProduct.price).toFixed(2)}`],
                ["Per", selectedProduct.per],
                ["Discount", `${parseFloat(selectedProduct.discount).toFixed(2)}%`],
                ["Box Count", selectedProduct.box_count],
                ["Status", capitalize(selectedProduct.status)],
                ["Brand", selectedProduct.brand || "—"],
                ["Free", selectedProduct.free ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                  <div className="text-sm font-semibold text-slate-700 mt-0.5">{value}</div>
                </div>
              ))}
              {selectedProduct.description && (
                <div className="col-span-2 bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</div>
                  <div className="text-sm font-semibold text-slate-700 mt-0.5">{selectedProduct.description}</div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={closeModal} className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={editModalIsOpen} onRequestClose={closeModal} className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black/50">
        {renderModalForm(true)}
      </Modal>

      <Modal isOpen={addModalIsOpen} onRequestClose={closeModal} className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black/50">
        {renderModalForm(false)}
      </Modal>

      <Modal isOpen={deleteModalIsOpen} onRequestClose={closeModal} className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black/50">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-2.5">Delete Product?</h2>
          <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete <strong className="text-slate-800">{productToDelete?.productname}</strong>? This cannot be undone.</p>
          <div className="flex gap-2.5 justify-center">
            <button onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Keep It</button>
            <button onClick={() => handleDelete(productToDelete)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-500 transition-all duration-200">Yes, Delete</button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={bulkUploadModalIsOpen}
        onRequestClose={bulkUploading ? undefined : resetBulkUploadModal}
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
      >
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <FaUpload className="text-indigo-600 text-lg" /> Bulk Upload Product Images
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload a ZIP file or multiple image files. Files will automatically be matched and assigned to products by name or code.
              </p>
            </div>
            {!bulkUploading && (
              <button
                onClick={resetBulkUploadModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 pr-1 space-y-4">
            {/* Upload / Dropzone Area */}
            {bulkFiles.length === 0 && !bulkProcessingFiles && (
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-2xl p-8 text-center transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".zip,image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleBulkFileInput}
                  className="hidden"
                  id="bulk-image-file-input"
                />
                <label
                  htmlFor="bulk-image-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                    <FaUpload className="text-2xl" />
                  </div>
                  <span className="font-bold text-slate-800 text-base mb-1">
                    Select Images or ZIP Archive
                  </span>
                  <span className="text-xs text-slate-500 max-w-md">
                    Choose multiple image files (JPG, PNG, WebP) or upload the downloaded <strong>all_product_images.zip</strong>.
                    Names like <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">28 CHORSA.jpg</code> or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">1013 28 CHORSA.jpg</code> will be matched automatically!
                  </span>
                  <span className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all">
                    Browse Files
                  </span>
                </label>
              </div>
            )}

            {/* Legacy Cloud Name Migration Quick Action */}
            {bulkFiles.length === 0 && !bulkProcessingFiles && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    🔄 Direct URL Cloud Name Replacement
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    If your new account already has these assets, click here to replace disabled <code className="text-slate-600 font-mono">bqbgj4yl</code> with active <code className="text-indigo-600 font-mono">l6fbxbak</code> directly in the database.
                  </div>
                  {migrationStatus && (
                    <div className="text-xs font-bold text-indigo-600 mt-1">
                      {migrationStatus}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleMigrateLegacyCloudName}
                  disabled={migratingCloudName}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap disabled:opacity-50 shrink-0"
                >
                  {migratingCloudName ? "Updating URLs..." : "Replace bqbgj4yl with l6fbxbak"}
                </button>
              </div>
            )}

            {/* Processing state */}
            {bulkProcessingFiles && (
              <div className="py-12 text-center">
                <FaSpinner className="animate-spin text-3xl text-indigo-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Scanning & matching files to products...</p>
                <p className="text-xs text-slate-400 mt-1">Extracting archive if ZIP was provided</p>
              </div>
            )}

            {/* Results / Matching Summary */}
            {(bulkFiles.length > 0 || bulkUnmatched.length > 0) && !bulkProcessingFiles && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scanned</div>
                    <div className="text-xl font-extrabold text-slate-800 mt-0.5">
                      {bulkFiles.length + bulkUnmatched.length}
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Matched Images</div>
                    <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                      {bulkFiles.length} <span className="text-xs font-normal text-emerald-600">({bulkMatchedCount} products)</span>
                    </div>
                  </div>
                  <div className={`rounded-2xl p-3 text-center border ${bulkUnmatched.length > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                    <div className="text-xs font-bold uppercase tracking-wider">Unmatched</div>
                    <div className="text-xl font-extrabold mt-0.5">
                      {bulkUnmatched.length}
                    </div>
                  </div>
                </div>

                {/* Replace toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Replace Existing Images</div>
                    <div className="text-xs text-slate-500">
                      Overwrite old image URLs with the newly uploaded Cloudinary images (recommended for credential migration)
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={replaceExistingImages}
                      onChange={(e) => setReplaceExistingImages(e.target.checked)}
                      disabled={bulkUploading}
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${replaceExistingImages ? "bg-indigo-600" : "bg-slate-300"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${replaceExistingImages ? "translate-x-5.5 ml-0.5" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                </div>

                {/* Unmatched files list */}
                {bulkUnmatched.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                      <FaExclamationTriangle className="text-amber-600" />
                      {bulkUnmatched.length} files could not be matched to any product name or code:
                    </div>
                    <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1.5">
                      {bulkUnmatched.map((fn, i) => (
                        <span key={i} className="text-[11px] bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded-md font-mono">
                          {fn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview of matches */}
                {bulkFiles.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Matched Products Preview ({bulkFiles.length})
                      </span>
                      {!bulkUploading && (
                        <label
                          htmlFor="bulk-image-file-input-change"
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                        >
                          Change files
                          <input
                            type="file"
                            multiple
                            accept=".zip,image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleBulkFileInput}
                            className="hidden"
                            id="bulk-image-file-input-change"
                          />
                        </label>
                      )}
                    </div>
                    <div className="border border-slate-200 rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {bulkFiles.slice(0, 100).map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                          <div className="truncate pr-2">
                            <span className="font-mono text-slate-500 font-medium">{item.fileName}</span>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              [{item.product.serial_number}] {item.product.productname}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                              Matched
                            </span>
                          </div>
                        </div>
                      ))}
                      {bulkFiles.length > 100 && (
                        <div className="p-2 text-center text-xs text-slate-400 font-medium">
                          + {bulkFiles.length - 100} more matched items...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {bulkUploading && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                        <FaSpinner className="animate-spin text-sm" /> Uploading to Cloudinary & updating products...
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700">
                        {bulkUploadProgress.percent}%
                      </span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${bulkUploadProgress.percent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-indigo-500 mt-2 text-right">
                      {bulkUploadProgress.current} of {bulkUploadProgress.total} files processed
                    </div>
                  </div>
                )}

                {/* Upload Result */}
                {bulkUploadResult && (
                  <div className={`p-4 rounded-2xl border ${bulkUploadResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {bulkUploadResult.success ? <FaCheckCircle className="text-emerald-600 text-base" /> : <FaExclamationTriangle className="text-red-600 text-base" />}
                      {bulkUploadResult.success ? "Bulk Upload Complete!" : "Bulk Upload Error"}
                    </div>
                    <p className="text-xs mt-1">
                      {bulkUploadResult.success
                        ? `Successfully uploaded ${bulkUploadResult.totalFilesUploaded} images and updated ${bulkUploadResult.updatedProductsCount} products with new Cloudinary credentials!`
                        : bulkUploadResult.error || "Failed to complete bulk upload."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={resetBulkUploadModal}
              disabled={bulkUploading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {bulkUploadResult?.success ? "Done" : "Cancel"}
            </button>
            {bulkFiles.length > 0 && !bulkUploadResult?.success && (
              <button
                onClick={handleStartBulkUpload}
                disabled={bulkUploading || bulkFiles.length === 0}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {bulkUploading ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" /> Uploading ({bulkUploadProgress.percent}%)
                  </>
                ) : (
                  <>
                    <FaUpload className="text-xs" /> Upload & Update {bulkMatchedCount} Products
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}