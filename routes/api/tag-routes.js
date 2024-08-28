const router = require("express").Router();
const { Tag, Product, ProductTag } = require("../../models");

// The `/api/tags` endpoint

router.get("/", async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findAll({
      include: [{ model: Product }],
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/:id", async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [{ model: Product }],
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/", async (req, res) => {
  // create a new tag
  // {
  //   tag_name: "sale",
  //   productIds: [1, 2, 3, 4]
  // }
  try {
    const tag = await Tag.create(req.body);
    if (req.body.productIds && req.body.productIds.length) {
      const productTagIdArr = req.body.productIds.map((product_id) => {
        return {
          product_id,
          tag_id: tag.id,
        };
      });
      const prodTag = await ProductTag.bulkCreate(productTagIdArr);
      return res.status(200).json(prodTag);
    } else {
      return res.status(200).json(tag);
    }
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
});

router.put("/:id", async (req, res) => {
  // update a tag's name by its `id` value
  try {
    const tag = await Tag.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    if (req.body.productIds && req.body.productIds.length) {
      // retrieve all productTag data associated with the req id
      const productTags = await ProductTag.findAll({
        where: { tag_id: req.params.id },
      });
      //get all of the existing product tag ids in an array of product_ids
      const tagProductIds = productTags.map(({ product_id }) => product_id);
      // return an object of productIds and tagIds for products not found in the existing junction table
      const newProductTags = req.body.productIds
        .filter((product_id) => !tagProductIds.includes(product_id))
        .map((product_id) => {
          return {
            product_id,
            tag_id: req.params.id,
          };
        });
      // return an array that has all productIds that were removed in the body request by filtering the productTags (search for existing values in junction table)
      const tagProductsToRemove = productTags
        .filter(({ product_id }) => !req.body.productIds.includes(product_id))
        .map(({ id }) => id);

      await Promise.all([
        ProductTag.destroy({ where: { id: tagProductsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    }
    res.status(200).json(tag);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.delete("/:id", async (req, res) => {
  // delete on tag by its `id` value
  try {
    const tagData = await Tag.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
