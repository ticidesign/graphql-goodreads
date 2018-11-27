const fetch = require('node-fetch');
const util = require('util')
const parseXML = util.promisify(require('xml2js').parseString);
const {
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLString,
	GraphQLInt,
	GraphQLList,
} = require('graphql');

const BookType  = new GraphQLObjectType({
	name: 'Book',
	description: '...',

	fields: () => ({
		title: {
			type: GraphQLString,
			resolve: xml => xml.GoodreadsResponse.book[0].title[0]
		},
		isbn: {
			type: GraphQLString,
			resolve: xml => xml.GoodreadsResponse.book[0].isbn[0]
		}
	})
})

const AuthorType = new GraphQLObjectType({
	name: 'Author',
	description: '...',

	fields: () => ({
		name: {
			type: GraphQLString,
			resolve: xml => xml.GoodreadsResponse.author[0].name[0]
		},
		books: {
			type: GraphQLList(BookType),
			resolve: xml =>	{
				const ids = xml.GoodreadsResponse.author[0].books[0].book.map(elem => elem.id[0]._)
				return Promise.all(ids.map(id =>
					fetch(`https://www.goodreads.com/book/show.xml?id=${id}&key=LcUN11XzmL86rFzIcNhxw`)
					.then(response => response.text())
					.then(parseXML)
				))
			}
		}
	})

})

module.exports = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		description: '...',
		fields: () => ({
			author: {
				type: AuthorType,
				args: {
					id: { type: GraphQLInt }
				},
				resolve: (root, args) => fetch(
					`https://www.goodreads.com/author/show.xml?id=${args.id}&key=LcUN11XzmL86rFzIcNhxw`
				)
				.then(res => res.text()) // will return a xml format
				.then(parseXML)
			}
		})
	})
})
