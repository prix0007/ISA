import React from 'react'

const About = () => {
    return (
        <div>
            <div>
                <h3 className="title">ISAs on Superfluid.</h3>
                <p className="subtitle">Made for ETHOdyssey 2021. Participant: Prince Anuragi</p>
            </div>
            <div className="mt-5">
                <p><strong>Roles</strong></p>
                <ul>
                    <li><strong>Student:</strong> Needing for a loan, against a Income Share Agreement. (Role to approve institute and later recieve their income)</li>
                    <li><strong>Lender:</strong> Who will lend the money to student for Institute X.</li>
                    <li><strong>Institute:</strong> Entity which will be able to withdraw money after student's approval</li>
                    <li><strong>Company:</strong> Who will pay contract after student get Job at their company.</li>
                </ul>
            </div>
            <div className="mt-5">
                <p ><strong>Benefits for Using ISA to various Roles</strong></p>
                <p className="mt-3 title is-6 is-underlined">Student</p>
                <ul>
                    <li>Superfast Loan Processing.</li>
                    <li>Easy to find lenders who want their share from investment.</li>
                    <li>Less Hassle when repaying. Contract does it all according to threshold salary.</li>
                    <li>Easy to send to institute.</li>
                    <li>Initiative for lender to help in career after Institute.</li>
                </ul>
                <p className="mt-3 title is-6 is-underlined">Lender</p>
                <ul>
                    <li>Fully Secure as everythiung is onChain.</li>
                    <li>No issues when getting repaid via flows. Get paid by the second.</li>
                    <li>ISA can be traded further to another lender for price fixed by lender.</li>
                    <li>Repayment threshold for lender safety.</li>
                    <li>If Student gets more salary more the profits to you.</li>
                </ul>
                <p className="mt-3 title is-6 is-underlined">Institue</p>
                <ul>
                    <li>One Click Instant Withdrawl.</li>
                    <li>Ease of Use.</li>
                </ul>
                <p className="mt-3 title is-6 is-underlined">Company</p>
                <ul>
                    <li>Less Processing and Pay by second.</li>
                    <li>Easy to pay to contract with just address to remember.</li>
                </ul>
            </div>
        </div>
    )
}

export default About
