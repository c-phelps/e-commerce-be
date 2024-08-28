const router = require("express").Router();
const { Product, Category, Tag, ProductTag } = require("../../models");

// The `/api/products` endpoint

// get all products
router.get("/", async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get("/:id", async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post("/", (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// added  my own comments to try and decipher what is happening
// update product
router.put("/:id", (req, res) => {
  // update product data
  Product.update(req.body, {
    // call update on WHERE id = param id
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      //that update is being returned as a promise in this then as product
      if (req.body.tagIds && req.body.tagIds.length) {
        //if tagsIds exists and the array is not empty
        ProductTag.findAll({
          // tags exists, return values from productTag as a promise WHERE the product ids align
          where: { product_id: req.params.id },
        }).then((productTags) => {
          //promised prodcutTag results
          // create filtered list of new tag_ids
          const productTagIds = productTags.map(({ tag_id }) => tag_id); //convert the object to an array of tag_ids
          const newProductTags = req.body.tagIds
            .filter((tag_id) => !productTagIds.includes(tag_id)) //filter the array to only include where the productTagId does not exist in the req
            .map((tag_id) => {
              //return an array of objects with the product id and tag id for the producttag model/junction table
              return {
                product_id: req.params.id,
                tag_id,
              };
            });

          // figure out which ones to remove
          const productTagsToRemove = productTags
            .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id)) //check the promised procutTag search (destructured as tagid) is not includeded in the req body
            .map(({ id }) => id); // returns a new array of only the id properties of the product object
          // run both actions
          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsToRemove } }),
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }

      return res.json(product);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete("/:id", async (req, res) => {
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
