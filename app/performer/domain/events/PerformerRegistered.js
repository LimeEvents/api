const slug = require('slug')
const assert = require('assert')

const slugify = (str) => slug(str).toLowerCase()
const BaseEvent = require('@nerdsauce/adapters/BaseEvent')

module.exports = class PerformerRegistered extends BaseEvent {
  constructor ({ id, name, caption, description, images, videos }) {
    id = id || slugify(name)
    super({ id, name, caption, description, images, videos })
    assert(this.name, 'PerformerRegistered: Field "name" is required')
    this.meta.type = 'PerformerRegistered'
    // assert(this.caption, 'PerformerRegistered: Field "caption" is required')
    // assert(this.description, 'PerformerRegistered: Field "description" is required')
    // assert(this.images, 'PerformerRegistered: Field "images" is required')
    // assert(this.videos, 'PerformerRegistered: Field "videos" is required')
  }
}
