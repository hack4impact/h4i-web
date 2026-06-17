import {
  documentToReactComponents,
  Options,
} from '@contentful/rich-text-react-renderer'
import { BLOCKS, Document, INLINES, MARKS } from '@contentful/rich-text-types'

const options: Options = {
  renderMark: {
    [MARKS.BOLD]: (text) => <strong>{text}</strong>,
    [MARKS.ITALIC]: (text) => <em>{text}</em>,
    [MARKS.UNDERLINE]: (text) => <u>{text}</u>,
    [MARKS.CODE]: (text) => (
      <code className='bg-panel rounded px-1 text-sm'>{text}</code>
    ),
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node, children) => (
      <p className='mb-4 text-lg md:text-xl'>{children}</p>
    ),
    [BLOCKS.HEADING_1]: (_node, children) => (
      <h1 className='mt-10 mb-6 font-sans text-2xl md:text-3xl'>{children}</h1>
    ),
    [BLOCKS.HEADING_2]: (_node, children) => (
      <h2 className='mt-8 mb-4 font-sans text-xl md:text-2xl'>{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (_node, children) => (
      <h3 className='mt-6 mb-3 font-sans text-lg md:text-xl'>{children}</h3>
    ),
    [BLOCKS.HEADING_4]: (_node, children) => (
      <h4 className='mt-4 mb-2 font-sans text-base md:text-lg'>{children}</h4>
    ),
    [BLOCKS.HEADING_5]: (_node, children) => (
      <h5 className='mt-4 mb-2 font-sans text-sm md:text-base'>{children}</h5>
    ),
    [BLOCKS.HEADING_6]: (_node, children) => (
      <h6 className='mt-4 mb-2 font-sans text-sm'>{children}</h6>
    ),
    [BLOCKS.UL_LIST]: (_node, children) => (
      <ul className='mb-4 list-disc space-y-1 pl-6'>{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (_node, children) => (
      <ol className='mb-4 list-decimal space-y-1 pl-6'>{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (_node, children) => (
      <li className='text-lg md:text-xl'>{children}</li>
    ),
    [BLOCKS.QUOTE]: (_node, children) => (
      <blockquote className='border-separator my-4 border-l-4 pl-4 italic'>
        {children}
      </blockquote>
    ),
    [BLOCKS.HR]: () => <hr className='border-separator my-8 border-t' />,
    [BLOCKS.TABLE]: (_node, children) => (
      <div className='my-4 overflow-x-auto'>
        <table className='border-separator min-w-full border-collapse border'>
          <tbody>{children}</tbody>
        </table>
      </div>
    ),
    [BLOCKS.TABLE_ROW]: (_node, children) => <tr>{children}</tr>,
    [BLOCKS.TABLE_CELL]: (_node, children) => (
      <td className='border-separator border px-4 py-2 text-base'>
        {children}
      </td>
    ),
    [BLOCKS.TABLE_HEADER_CELL]: (_node, children) => (
      <th className='border-separator bg-panel border px-4 py-2 font-sans text-base'>
        {children}
      </th>
    ),
    [INLINES.HYPERLINK]: (node, children) => (
      <a
        href={node.data.uri}
        className='text-blue-500 underline hover:text-blue-600'
        target='_blank'
        rel='noopener noreferrer'
      >
        {children}
      </a>
    ),
  },
}

export function RichText({ document }: { document: Document }) {
  return <>{documentToReactComponents(document, options)}</>
}
