import { Link } from "react-router-dom"

/*
 * The full lore lives here and nowhere else in the interface.
 * The page reads as a definitive overview: the tree, the folklore on it, then
 * the legend it belongs to. Attribution sits in the source list at the foot,
 * never in the sentence. Where the record is uncertain the page says so plainly
 * or leaves the claim out. It never hedges with a publisher's name.
 * Every claim matches docs/knowledge/lore/. Read docs/brand/story.md for the
 * boundary, and docs/brand/voice-and-tone.md for the rules of this page.
 */

type Source = {
  publisher: string
  title: string
  url: string
}

const SOURCES: Source[] = [
  {
    publisher: "RSPB",
    title: "The Major Oak",
    url: "https://www.rspb.org.uk/whats-happening/news/the-major-oak",
  },
  {
    publisher: "Visit Sherwood",
    title: "The Major Oak",
    url: "https://visitsherwood.co.uk/explore-the-forest/the-major-oak/",
  },
  {
    publisher: "Visit Sherwood",
    title: "Major Oak information document, July 2026",
    url: "https://visitsherwood.co.uk/wp-content/uploads/2026/06/Major-Oak-information-document-July-2026-V_17_06_26-3.pdf",
  },
  {
    publisher: "Visit Sherwood",
    title: "The man who made the Major Oak",
    url: "https://visitsherwood.co.uk/celebrating-the-man-who-made-the-major-oak/",
  },
  {
    publisher: "Visit Sherwood",
    title: "About Robin Hood",
    url: "https://visitsherwood.co.uk/about-robin-hood/",
  },
  {
    publisher: "BBC News",
    title: "The death of the Major Oak",
    url: "https://www.bbc.co.uk/news/articles/clyer9m0jmko",
  },
  {
    publisher: "Nottinghamshire County Council",
    title: "The history of Sherwood Forest",
    url: "https://www.nottinghamshire.gov.uk/culture-leisure/country-parks/history-of-sherwood-forest-robin-hood-and-major-oak",
  },
  {
    publisher: "Sherwood Forest Trust",
    title: "History and legend",
    url: "https://sherwoodforest.org.uk/history-legend/",
  },
  {
    publisher: "Woodland Trust",
    title: "Ancient Tree Inventory, tree 1",
    url: "https://ati.woodlandtrust.org.uk/tree-search/tree?treeid=+1",
  },
  {
    publisher: "Mercian Archaeological Services",
    title: "Thynghowe",
    url: "http://www.mercian-as.co.uk/thynghowesfap.html",
  },
  {
    publisher: "Heritage Gateway",
    title: "Thynghowe record",
    url: "https://heritagegateway.org.uk/Gateway/Results_Single.aspx?uid=1461548&resourceID=19191",
  },
]

export function NamePage() {
  return (
    <main className="page shell" id="main">
      <div className="page-column prose-column">
        <div className="page-head">
          <span className="eyebrow">Lore</span>
          <h1 className="page-title">The Major Oak</h1>
          <p className="page-sub">
            One oak in Sherwood Forest is tied to the Robin Hood legend. This is the tree, the folklore
            on it, and the legend it belongs to.
          </p>
        </div>

        <div className="prose">
          <h2 id="tree">The tree</h2>
          <p>
            The Major Oak stands in Birklands, the old oak wood north of Edwinstowe in
            Nottinghamshire. It is a Quercus robur, the English oak, somewhere between eight and
            twelve centuries old. The RSPB cares for the ground it grows on.
          </p>
          <p>
            It does not look like other oaks. The trunk is short and hollow, opened by fungi over
            centuries of slow decay. Out of it reach limbs so long and so heavy that the tree cannot
            carry them alone: a canopy of twenty-eight metres at its widest, a girth of about eleven,
            an estimated twenty-three tonnes of standing timber. Iron rods and braces have held the
            largest branches since at least 1904, and metal poles replaced the old wooden crutches in
            the early 2000s.
          </p>
          <p>
            Much of that shape is human work. The oak was pollarded, cut back above the reach of
            grazing animals so that it regrew from the wound. Its form is the record of a working
            forest rather than of an accident.
          </p>
          <p>
            It is the first tree entered on the Ancient Tree Inventory, and it was England's Tree of
            the Year in 2014.
          </p>
          <p>
            In the spring of 2026 no leaves came. The Major Oak is dead. It will not be felled. It
            stays standing as a monument, its props in place until they become unsafe, and in time the
            wood will feed the ground it grew out of. Acorns and cuttings taken over the years are
            growing in many places now. Those are new trees. There is only one Major Oak.
          </p>

          <h2 id="name">The name</h2>
          <p>
            The tree is named for Major Hayman Rooke, an antiquarian born in 1723 and dead in 1806,
            buried at Mansfield Woodhouse where he had lived. He served in the army, retired at the
            rank of major, and gave his later years to drawing and describing the great oaks of
            Nottinghamshire. His published accounts brought the first visitors into the forest to
            look at one particular tree.
          </p>
          <p>
            Major is his rank. It is not a species, and it is not a comment on the size of the tree.
          </p>
          <p>
            Rooke's is not the only name the tree has answered to. In the middle of the nineteenth
            century this was the Cockpen Tree, after the cockfighting held under its branches.
          </p>

          <h2 id="hideout">The hideout</h2>
          <p>Folklore puts Robin Hood and his men inside the trunk.</p>
          <p>
            The story is simple, and it has lasted. The hollow is a shelter. The band sleeps in it
            while the Sheriff's men pass by on the road. Nothing in the record places anyone in this
            tree, and the tale is folklore rather than history, but it is the reason that this oak,
            out of several hundred ancient oaks in Sherwood, is the one people travel to see.
          </p>
          <p>
            For most of the twentieth century they could do more than look. Visitors climbed into the
            hollow and stood inside it, until a fence went up in the 1970s to spare the roots the
            weight of their feet.
          </p>
          <p>
            The tree's own age cannot settle the question. At the young end of its range it was a
            sapling in the years the legend is set. At the old end it was already ancient by then.
            Neither figure proves the story, and neither disposes of it.
          </p>
          <p>
            Two other trees are often mistaken for this one. Robin Hood's Larder was a second hollow
            oak in Sherwood, said in folklore to have held poached meat, and the wind brought it down
            last century. The tree from the 1991 film is the Sycamore Gap tree, a sycamore that stood
            beside Hadrian's Wall in Northumberland, some hundred and seventy miles from here, and
            that was cut down in 2023.
          </p>

          <h2 id="forest">The forest</h2>
          <p>
            Sherwood was a forest in the legal sense long before the word meant a mass of trees. It
            marked ground held under the king's own law, and it described who answered for the land
            rather than what grew on it.
          </p>
          <p>
            The name is older than the law. It appears in 958 as Sciryuda, the wood that belongs to
            the shire. After 1066 it became a royal hunting ground, and by the thirteenth century it
            covered about a hundred thousand acres, close to a fifth of Nottinghamshire.
          </p>
          <p>
            It was never a wall of trees. Sherwood mixed oak and birch wood with sandy heath and
            rough grass, held three royal deer parks, and carried ordinary work throughout: coppicing,
            pollarding, charcoal burning, oak bark stripped for the tanneries, pigs turned out to feed
            on acorns. Royal law protected the vert and the venison, the green cover and the game
            that needed it, and a bench of foresters, agisters and verderers enforced it.
          </p>
          <p>
            The Great North Way from London to York ran through the middle of it, and men who lived
            outside the law lived off that road. This is the ground the legend needs: a rich traveller
            on a known route, a long stretch of cover beside it, and a law that could make a criminal
            of a man for taking a deer.
          </p>
          <p>
            What is left of it is a fragment. Birklands has been protected since
            1954, Sherwood became a National Nature Reserve in 2002, and the wood holds almost four
            hundred living ancient oaks and more than five hundred veterans, among the largest
            gatherings of their kind in Western Europe.
          </p>

          <h2 id="outlaw">The outlaw</h2>
          <p>
            Robin Hood is a legend, and the legend is older than any document that carries it. No
            record fixes a single man behind the name. The candidates run from a dispossessed Saxon
            earl to a common thief, and the question has never been settled.
          </p>
          <p>
            The name enters writing in 1377, when William Langland names the rhymes of Robin Hood in
            Piers Plowman. A line from about 1400 places him in Sherwood. Both are passing references,
            which tells us the stories were already common property by then.
          </p>
          <p>
            The early body of work is small: a handful of ballads and one long narrative poem of more
            than four hundred verses, A Lyttell Gest of Robyn Hode, set down in the middle of the
            fifteenth century.
          </p>
          <p>
            The Robin of those texts is not the Robin of the films. He is a yeoman rather than a
            nobleman, a free commoner. He is courteous and devout. He is also violent when the
            ballad requires it. He is already the finest archer in the stories and already the
            sworn enemy of the Sheriff of Nottingham. Little John is with him, and Much the
            Miller's Son, and Will Scarlet.
          </p>
          <p>
            Almost everything else arrived later. Maid Marian and Friar Tuck came out of the May games
            and the playhouse. The earldom of Huntingdon came off the stage, and so did the familiar
            frame of a good King Richard abroad and a bad Prince John at home. The motto is a later
            gloss as well: the early verses announce no policy of robbing the rich to pay the poor,
            though they do show care for poor men, and they do order the band to leave a ploughman or
            an honest yeoman alone.
          </p>
          <p>
            The colour is old. Tradition dresses the band in Lincoln green, a deep woollen cloth named
            for the city that wove it.
          </p>
          <p>
            One thing the ballads never settle is where he belongs. The earliest place names point to
            Sherwood and to Barnsdale in Yorkshire in nearly equal measure, and many historians give
            Yorkshire the stronger claim on the origin. The legend is now tied to Sherwood.
          </p>

          <h2 id="gest">A loan, a due day, and a count</h2>
          <p>The longest of the early poems is about a debt.</p>
          <p>
            A knight rides into Barnsdale with nothing. He has pledged his land to the Abbot of St
            Mary's in York against four hundred pounds, the loan has fallen due, and he has ten
            shillings to his name. The band brings him in to dinner, and Robin asks him the question
            every lender asks: who will stand behind you? The knight has no one, and names Our Lady.
            Robin accepts her as surety, counts out the four hundred pounds, adds cloth and a horse
            and Little John for company, and sets the term at a year.
          </p>
          <p>
            The knight reaches York in poor clothes and asks the abbot for more time. The abbot refuses
            him, and the justice sitting with him refuses too. Then the knight pours four hundred
            pounds onto the table and keeps his land.
          </p>
          <p>
            A year later the band stops a monk on the road, the chief steward of the same abbey. Robin
            asks him what he is carrying. Twenty marks, the monk says. Little John opens the bags and
            counts eight hundred pounds. Robin takes it as Our Lady paying the debt she stood for,
            twice over.
          </p>
          <p>
            Later a king arrives in an abbot's habit and produces the royal seal. Robin kneels to the
            seal. The habit was a disguise. The seal was genuine.
          </p>

          <h2 id="meeting">Appointed places</h2>
          <p>
            The legend is full of arranged meetings, and the ground around the oak holds several real
            ones.
          </p>
          <p>
            A trysting tree, in the hunting sense the ballads use, is a fixed stand where a man waits
            while the deer are driven towards him. It is a place agreed in advance by people who need
            to find each other in a wood.
          </p>
          <p>
            The same wood holds Thynghowe, a Viking Age assembly site whose Old Norse name means
            exactly that: the assembly mound. It sits on Hanger Hill where three parishes meet, marked
            with boundary stones, recorded by name in 1334 and again in 1609. People came to it to
            settle disputes.
          </p>
          <p>
            Parliament Oak, near Clipstone, is a different tree with a story of its own. A king is
            said to have held council beneath it.
          </p>

          <h2 id="brand">What we took</h2>
          <p>We took the name, and one idea with it.</p>
          <p>
            For as long as the story has been told, the Major Oak has been the place people go to. It
            is the fixed point in a moving tale: somewhere known, named in advance, and the same for
            everyone who arrives. MajorOak Settlements is a place of that kind. Two parties meet at an
            agreed contract and complete a deal there.
          </p>
          <p>
            That is the whole of the connection. We do not read the rest of it as a plan for a
            product. The legend stays a legend, the hideout stays folklore, and a poem about a loan is
            not a contract.
          </p>
          <p>
            We leave the costume alone as well. There is no robbery in this brand and no weapons in it.
          </p>
          <p>
            We keep the name now the tree has gone. The meeting place is the idea we took.
          </p>

          <h2 id="sources">Sources</h2>
          <p>
            Every claim on this page rests on the work below. Where the record is genuinely uncertain,
            the page says so in the sentence. Where a claim could not be checked, the page leaves it
            out.
          </p>
          <ul>
            {SOURCES.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.publisher}, {source.title}
                </a>
              </li>
            ))}
          </ul>
          <p className="prose-note">Sources checked on 14 August 2026.</p>

          <p>
            Read <Link to="/about">what the product does</Link> for the escrow, the fee, and the
            limits.
          </p>
        </div>
      </div>
    </main>
  )
}
