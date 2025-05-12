const express = require('express')
const router = express.Router()
const passport = require('passport')

// Bring in Models & Utils
const Category = require('../../models/category')
const auth = require('../../middleware/auth')
const role = require('../../middleware/role')
const store = require('../../utils/store')
const { ROLES } = require('../../constants')

// Add new category
router.post('/add', auth, role.check(ROLES.Admin), (req, res) => {
  const { name, description, products, isActive } = req.body

  if (!description || !name) {
    return res.status(400).json({ error: 'You must enter description & name.' })
  }

  const category = new Category({
    name,
    description,
    products,
    isActive
  })

  category.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      })
    }

    res.status(200).json({
      success: true,
      message: `Category has been added successfully!`,
      category: data
    })
  })
})

// ✅ Fetch store categories (only active)
router.get('/list', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
    res.status(200).json({ categories })
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    })
  }
})

// ✅ Fetch all categories + product IDs + slugs
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate({
        path: 'products',
        select: '_id slug'
      })
      .lean()

    // convert populated products to just _id and slug
    const categoriesWithProducts = categories.map(category => ({
      ...category,
      products: category.products.map(product => ({
        _id: product._id,
        slug: product.slug
      }))
    }))

    res.status(200).json({
      categories: categoriesWithProducts
    })
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    })
  }
})

// Fetch category by ID
router.get('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id

    const categoryDoc = await Category.findOne({ _id: categoryId }).populate({
      path: 'products',
      select: 'name'
    })

    if (!categoryDoc) {
      return res.status(404).json({
        message: 'No Category found.'
      })
    }

    res.status(200).json({
      category: categoryDoc
    })
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    })
  }
})

// Update category
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const categoryId = req.params.id
    const update = req.body.category
    const query = { _id: categoryId }
    const { slug } = req.body.category

    const foundCategory = await Category.findOne({
      $or: [{ slug }]
    })

    if (foundCategory && foundCategory._id != categoryId) {
      return res.status(400).json({ error: 'Slug is already in use.' })
    }

    await Category.findOneAndUpdate(query, update, { new: true })

    res.status(200).json({
      success: true,
      message: 'Category has been updated successfully!'
    })
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    })
  }
})

// Enable/disable category
router.put('/:id/active', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const categoryId = req.params.id
    const update = req.body.category
    const query = { _id: categoryId }

    // disable category products
    if (!update.isActive) {
      const categoryDoc = await Category.findOne(
        { _id: categoryId, isActive: true },
        'products -_id'
      ).populate('products')

      store.disableProducts(categoryDoc.products)
    }

    await Category.findOneAndUpdate(query, update, { new: true })

    res.status(200).json({
      success: true,
      message: 'Category has been updated successfully!'
    })
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    })
  }
})

// Delete category
router.delete(
  '/delete/:id',
  auth,
  role.check(ROLES.Admin),
  async (req, res) => {
    try {
      const category = await Category.deleteOne({ _id: req.params.id })

      res.status(200).json({
        success: true,
        message: `Category has been deleted successfully!`,
        category
      })
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      })
    }
  }
)

module.exports = router
